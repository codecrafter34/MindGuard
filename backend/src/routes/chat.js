// routes/chat.js — POST /api/chat
//
// Conversational support chat using IBM watsonx.ai Granite.
//
// PIPELINE:
//   1. requireSession middleware validates the Bearer token.
//   2. Safety classifier runs on the user message.
//      - CRISIS/DISTRESS → return pre-written resources immediately (no LLM)
//      - SAFE            → continue to Granite generation
//   3. Load last 6 messages of conversation history from Cloudant.
//   4. Build prompt using chatPrompts.buildChatPrompt.
//   5. Call watsonx.ai for response.
//   6. Persist full turn (user + assistant) to Cloudant.
//   7. Return response with safety label and disclaimer.

const express   = require('express');
const { requireSession }         = require('../middleware/auth');
const { classifyMessage }        = require('../services/safetyClassifier');
const { buildChatPrompt }        = require('../constants/chatPrompts');
const { CRISIS_RESPONSE, DISTRESS_RESPONSE } = require('../constants/safetyResponses');
const { chat }                   = require('../services/watsonxClient');
const { insertDocument, findDocuments, getClient, dbName } = require('../services/cloudantClient');

const router = express.Router();

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function getConversationHistory(sessionHash) {
  try {
    const docs = await findDocuments(
      dbName('conversations'),
      { session_hash: sessionHash },
      1
    );
    return docs.length > 0 ? docs[0].messages || [] : [];
  } catch {
    return [];
  }
}

async function saveConversationTurn(sessionHash, history) {
  try {
    const db = dbName('conversations');
    const client = getClient();
    // Try to find existing conversation document for this session
    const docs = await findDocuments(db, { session_hash: sessionHash }, 1);

    if (docs.length > 0) {
      const existing = docs[0];
      await client.putDocument({
        db,
        docId: existing._id,
        document: {
          ...existing,
          messages: history,
          updated_at: new Date().toISOString(),
        },
      });
    } else {
      await insertDocument(db, {
        type: 'conversation',
        session_hash: sessionHash,
        messages: history,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Non-fatal — log but don't break the chat response
    console.error('[chat] Failed to persist conversation:', err.message);
  }
}

// ── ROUTE ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 *
 * Headers:
 *   Authorization: Bearer <sessionToken>
 *
 * Body:
 * {
 *   "message": "I've been feeling really anxious lately",
 *   "includeHistory": true   (optional, default true)
 * }
 *
 * Response 200:
 * {
 *   "response": "...",
 *   "safetyLabel": "SAFE",
 *   "disclaimer": "...",
 *   "isCrisisResponse": false
 * }
 */
router.post('/chat', requireSession, async (req, res, next) => {
  try {
    const { message, includeHistory = true } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'message field is required.' });
    }

    const userMessage = message.trim().slice(0, 2000); // cap input length

    // ── Step 1: Safety classification ─────────────────────────────────────────
    const { label: safetyLabel } = await classifyMessage(userMessage);

    // ── Step 2: Handle CRISIS / DISTRESS immediately ──────────────────────────
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

    if (safetyLabel === 'DISTRESS') {
      // For DISTRESS: show support resources AND allow the conversation to continue
      // (unlike CRISIS which hard-stops). We generate a supportive reply.
    }

    // ── Step 3: Load conversation history ─────────────────────────────────────
    const history = includeHistory
      ? await getConversationHistory(req.sessionHash)
      : [];

    // ── Step 4: Build prompt and call Granite ─────────────────────────────────
    const messages = buildChatPrompt(userMessage, history);
    const aiReply  = await chat(messages, { max_new_tokens: 400, temperature: 0.7 });

    // ── Step 5: Persist conversation turn ─────────────────────────────────────
    const updatedHistory = [
      ...history,
      { role: 'user',      content: userMessage, timestamp: new Date().toISOString(), safetyLabel },
      { role: 'assistant', content: aiReply,     timestamp: new Date().toISOString() },
    ];
    // Keep last 20 messages to prevent the document from growing unbounded
    const trimmedHistory = updatedHistory.slice(-20);
    await saveConversationTurn(req.sessionHash, trimmedHistory);

    // ── Step 6: Respond ───────────────────────────────────────────────────────
    const responsePayload = {
      response: aiReply,
      safetyLabel,
      disclaimer: 'MindGuard AI is an educational tool only. Please consult a qualified mental health professional for personalised care.',
      isCrisisResponse: false,
    };

    // If DISTRESS, attach resources without blocking the conversation
    if (safetyLabel === 'DISTRESS') {
      responsePayload.resources = DISTRESS_RESPONSE.resources;
      responsePayload.distressNotice = DISTRESS_RESPONSE.message;
    }

    return res.status(200).json(responsePayload);

  } catch (err) {
    next(err);
  }
});

module.exports = router;
