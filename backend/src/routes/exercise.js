const express = require('express');
const { requireSession } = require('../middleware/auth');
const { insertDocument, findDocuments, dbName } = require('../services/cloudantClient');

const router = express.Router();

// ── POST /api/exercises/complete ──────────────────────────────────────────────
router.post('/exercises/complete', requireSession, async (req, res, next) => {
  try {
    const { exerciseName, duration, completedAt, metadata } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: 'exerciseName is required' });
    }

    const doc = {
      type: 'exercise',
      session_hash: req.sessionHash,
      exerciseName,
      duration: Number(duration) || 0,
      completedAt: completedAt || new Date().toISOString(),
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    };

    const saved = await insertDocument(dbName('exercises'), doc);

    return res.status(201).json({
      success: true,
      id: saved.id,
      doc
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/exercises/history ────────────────────────────────────────────────
router.get('/exercises/history', requireSession, async (req, res, next) => {
  try {
    const entries = await findDocuments(
      dbName('exercises'),
      { type: 'exercise', session_hash: req.sessionHash },
      100 // Fetch up to 100 recent exercises for stats
    );

    // Sort by completedAt descending
    entries.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return res.status(200).json({
      history: entries.map(e => ({
        id: e._id,
        exerciseName: e.exerciseName,
        duration: e.duration,
        completedAt: e.completedAt,
        metadata: e.metadata
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
