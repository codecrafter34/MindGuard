// routes/journal.js
// POST /api/journal — submit a journal entry, receive a supportive reflection
// GET  /api/journal — list the current session's journal entries (paginated)

const express = require('express');
const { requireSession }           = require('../middleware/auth');
const { classifyMessage }          = require('../services/safetyClassifier');
const { generateReflection }       = require('../services/journalService');
const { CRISIS_RESPONSE }          = require('../constants/safetyResponses');
const { insertDocument, findDocuments, dbName } = require('../services/cloudantClient');

const router = express.Router();

// ── POST /api/journal ─────────────────────────────────────────────────────────

/**
 * Submit a journal entry.
 *
 * Body: { "entryText": "Today was hard..." }
 *
 * Response 201:
 * {
 *   "entryId": "...",
 *   "reflection": "...",
 *   "safetyLabel": "SAFE",
 *   "disclaimer": "..."
 * }
 */
router.post('/journal', requireSession, async (req, res, next) => {
  try {
    const { entryText } = req.body;

    if (!entryText || typeof entryText !== 'string' || entryText.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'entryText field is required.' });
    }

    const text = entryText.trim().slice(0, 3000);

    // ── Safety gate ────────────────────────────────────────────────────────────
    const { label: safetyLabel } = await classifyMessage(text);

    if (safetyLabel === 'CRISIS') {
      // Even for journal entries, store the event (anonymised — no entry text)
      // so we have an audit record, then return the crisis response.
      await insertDocument(dbName('safety_events'), {
        type: 'safety_event',
        session_hash: req.sessionHash,
        timestamp: new Date().toISOString(),
        label: 'CRISIS',
        channel: 'journal',
      });

      return res.status(200).json({
        response: CRISIS_RESPONSE.message,
        safetyLabel: 'CRISIS',
        resources: CRISIS_RESPONSE.resources,
        emergency: CRISIS_RESPONSE.emergency,
        disclaimer: CRISIS_RESPONSE.disclaimer,
        isCrisisResponse: true,
      });
    }

    // ── Generate reflection ────────────────────────────────────────────────────
    const reflection = await generateReflection(text);

    // ── Persist journal entry (includes entry text — user's own data) ──────────
    const saved = await insertDocument(dbName('journals'), {
      type: 'journal_entry',
      session_hash: req.sessionHash,
      entry_text: text,
      reflection,
      safety_label: safetyLabel,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      entryId: saved.id,
      reflection,
      safetyLabel,
      disclaimer: 'This reflection is not clinical advice. Please speak with a mental health professional for personalised support.',
    });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/journal ──────────────────────────────────────────────────────────

/**
 * List journal entries for the current session.
 * Query params: ?limit=10 (default 10, max 50)
 */
router.get('/journal', requireSession, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const entries = await findDocuments(
      dbName('journals'),
      { type: 'journal_entry', session_hash: req.sessionHash },
      limit
    );

    // Return entries without entry_text to keep the response size small.
    // A GET /api/journal/:id endpoint can return the full text if needed.
    return res.status(200).json({
      entries: entries.map(e => ({
        id:          e._id,
        reflection:  e.reflection,
        safetyLabel: e.safety_label,
        createdAt:   e.created_at,
      })),
      total: entries.length,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
