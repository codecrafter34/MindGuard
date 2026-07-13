// routes/checkin.js
// POST /api/checkin        — submit a daily mood check-in
// GET  /api/checkin/history — retrieve last 7 check-ins for trend display

const express = require('express');
const { requireSession }           = require('../middleware/auth');
const { classifyMessage }          = require('../services/safetyClassifier');
const { generateCheckinSummary }   = require('../services/journalService');
const { DISTRESS_RESPONSE }        = require('../constants/safetyResponses');
const { insertDocument, findDocuments, dbName } = require('../services/cloudantClient');

const router = express.Router();

// ── POST /api/checkin ─────────────────────────────────────────────────────────

/**
 * Submit a mood check-in.
 *
 * Body:
 * {
 *   "moodScore": 6,         ← integer 1–10, required
 *   "note": "Felt tired"    ← optional free text
 * }
 *
 * Response 201:
 * {
 *   "checkinId": "...",
 *   "summary": "...",
 *   "safetyLabel": "SAFE",
 *   "moodScore": 6,
 *   "disclaimer": "..."
 * }
 */
router.post('/checkin', requireSession, async (req, res, next) => {
  try {
    const { moodScore, note } = req.body;

    // Validate moodScore
    const score = parseInt(moodScore);
    if (isNaN(score) || score < 1 || score > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'moodScore must be an integer between 1 and 10.',
      });
    }

    const noteText = note ? String(note).trim().slice(0, 500) : null;

    // ── Safety gate on optional note ───────────────────────────────────────────
    let safetyLabel = 'SAFE';
    if (noteText) {
      const result = await classifyMessage(noteText);
      safetyLabel  = result.label;
    }

    // Low mood score without crisis text → add to distress resources
    if (score <= 2 && safetyLabel === 'SAFE') {
      safetyLabel = 'DISTRESS';
    }

    // ── Generate AI summary ───────────────────────────────────────────────────
    const summary = await generateCheckinSummary(score, noteText);

    // ── Persist check-in ──────────────────────────────────────────────────────
    const saved = await insertDocument(dbName('checkins'), {
      type: 'checkin',
      session_hash: req.sessionHash,
      mood_score: score,
      note: noteText,
      summary,
      safety_label: safetyLabel,
      created_at: new Date().toISOString(),
    });

    const payload = {
      checkinId:  saved.id,
      summary,
      safetyLabel,
      moodScore:  score,
      disclaimer: 'This summary is not clinical advice.',
    };

    if (safetyLabel === 'DISTRESS' || safetyLabel === 'CRISIS') {
      payload.resources = DISTRESS_RESPONSE.resources;
    }

    return res.status(201).json(payload);

  } catch (err) {
    next(err);
  }
});

// ── GET /api/checkin/history ──────────────────────────────────────────────────

/**
 * Retrieve mood history for the current session.
 * Returns up to 7 most recent check-ins for a trend chart.
 */
router.get('/checkin/history', requireSession, async (req, res, next) => {
  try {
    const entries = await findDocuments(
      dbName('checkins'),
      { type: 'checkin', session_hash: req.sessionHash },
      7
    );

    return res.status(200).json({
      history: entries.map(e => ({
        id:        e._id,
        moodScore: e.mood_score,
        summary:   e.summary,
        createdAt: e.created_at,
      })),
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
