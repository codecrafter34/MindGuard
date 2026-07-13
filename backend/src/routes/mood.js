const express = require('express');
const { requireSession } = require('../middleware/auth');
const { classifyMessage } = require('../services/safetyClassifier');
const { insertDocument, findDocuments, dbName } = require('../services/cloudantClient');
const watsonx = require('../services/watsonxClient');

const router = express.Router();

// ── POST /api/mood ────────────────────────────────────────────────────────────
router.post('/mood', requireSession, async (req, res, next) => {
  try {
    const { mood, emoji, intensity, note, timestamp } = req.body;

    if (!mood || !emoji || intensity === undefined) {
      return res.status(400).json({ error: 'Missing required mood fields' });
    }

    const doc = {
      type: 'mood',
      session_hash: req.sessionHash,
      mood,
      emoji,
      intensity: Number(intensity),
      note: note ? String(note).trim().slice(0, 500) : null,
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const saved = await insertDocument(dbName('moods'), doc);

    return res.status(201).json({
      success: true,
      id: saved.id,
      doc
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mood/history ─────────────────────────────────────────────────────
router.get('/mood/history', requireSession, async (req, res, next) => {
  try {
    const entries = await findDocuments(
      dbName('moods'),
      { type: 'mood', session_hash: req.sessionHash },
      30 // fetch up to a month for stats
    );

    // Sort by timestamp descending
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      history: entries.map(e => ({
        id: e._id,
        mood: e.mood,
        emoji: e.emoji,
        intensity: e.intensity,
        note: e.note,
        timestamp: e.timestamp
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/mood/recommendation ─────────────────────────────────────────────
router.post('/mood/recommendation', requireSession, async (req, res, next) => {
  try {
    const { mood, intensity, note } = req.body;
    let isEmergency = false;

    // 1. Safety Check (Keyword & AI Classification)
    if (note) {
      const lowerNote = note.toLowerCase();
      const criticalKeywords = ['suicide', 'kill myself', 'die', 'hopeless', 'end my life'];
      
      const containsKeyword = criticalKeywords.some(kw => lowerNote.includes(kw));
      if (containsKeyword) {
        isEmergency = true;
      } else {
        const safetyResult = await classifyMessage(note);
        if (safetyResult.label === 'CRISIS' || safetyResult.label === 'DISTRESS') {
          isEmergency = true;
        }
      }
    }

    // 2. Generate Insight with watsonx.ai
    let insight = '';
    try {
      const prompt = `You are MindGuard AI, an empathetic and professional mental health companion.
The user just logged their mood as "${mood}" with an intensity of ${intensity}/10.
${note ? `They also added this note: "${note}"` : ''}

Provide a short, compassionate, and supportive insight (2-3 sentences max).
Do not use generic chatbot phrases like "As an AI". Speak directly to the user.
If they are unhappy, validate their feelings. If they are happy, encourage them.`;

      const generated = await watsonx.generate('ibm/granite-13b-chat-v2', prompt, {
        max_new_tokens: 100,
        temperature: 0.6
      });
      
      // Clean up the generated response in case it outputs extra conversational filler
      insight = generated.replace(/^Sure,\s*here.*/i, '').trim();
      
      // If generation fails or returns empty, provide a fallback based on mood
      if (!insight || insight.length < 10) {
        throw new Error('Empty response');
      }
    } catch (aiErr) {
      console.error('[Mood Tracker] AI Insight generation failed:', aiErr.message);
      insight = `You've logged your mood as ${mood}. Remember that every emotion is valid and part of your journey.`;
    }

    return res.status(200).json({
      insight,
      isEmergency
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
