// routes/ragChat.js — POST /api/rag-chat
//
// RAG-grounded question answering using the in-process vector store.
// Replaces the IBM Langflow integration with a fully self-contained pipeline.
//
// PIPELINE:
//   1. requireSession validates the Bearer token.
//   2. Safety classifier runs (same gate as /api/chat).
//   3. ragService.ragAnswer() embeds the query, retrieves relevant chunks
//      from the in-memory vector store, and calls Granite for a grounded answer.
//   4. The answer is returned with source attribution and a disclaimer.

const express  = require('express');
const { requireSession }          = require('../middleware/auth');
const { classifyMessage }         = require('../services/safetyClassifier');
const { ragAnswer }               = require('../services/ragService');
const { CRISIS_RESPONSE }         = require('../constants/safetyResponses');

const router = express.Router();

/**
 * POST /api/rag-chat
 *
 * Headers:
 *   Authorization: Bearer <sessionToken>
 *
 * Body:
 * { "message": "What is cognitive behavioural therapy?" }
 *
 * Response 200:
 * {
 *   "response": "...",
 *   "sources": ["nimh-depression", "who-mental-health"],
 *   "usedRag": true,
 *   "safetyLabel": "SAFE",
 *   "disclaimer": "..."
 * }
 */
router.post('/rag-chat', requireSession, async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'message field is required.' });
    }

    const query = message.trim().slice(0, 1000);

    // ── Safety gate ────────────────────────────────────────────────────────────
    const { label: safetyLabel } = await classifyMessage(query);
    if (safetyLabel === 'CRISIS') {
      return res.status(200).json({
        response: CRISIS_RESPONSE.message,
        safetyLabel: 'CRISIS',
        resources: CRISIS_RESPONSE.resources,
        emergency: CRISIS_RESPONSE.emergency,
        disclaimer: CRISIS_RESPONSE.disclaimer,
        isCrisisResponse: true,
      });
    }

    // ── RAG pipeline ───────────────────────────────────────────────────────────
    const { answer, sources, usedRag } = await ragAnswer(query);

    return res.status(200).json({
      response: answer,
      sources,
      usedRag,
      safetyLabel,
      disclaimer: 'This information is educational only. Please consult a qualified mental health professional for personalised advice.',
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
