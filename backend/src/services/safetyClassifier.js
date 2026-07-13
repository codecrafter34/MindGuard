// services/safetyClassifier.js
// Safety gate — classifies user input BEFORE any chat generation happens.
//
// DESIGN GUARANTEE:
//   This module runs first. If it returns CRISIS or DISTRESS, the caller
//   must NOT invoke any generative model and must return predefined resources.
//   This is a structural guarantee, not a prompt instruction — AI cannot
//   suppress it.
//
// TWO-LAYER APPROACH:
//   Layer 1: Hard keyword list — instant, zero-latency, zero-API-cost.
//            Catches obvious terms: "kill myself", "end my life", etc.
//            This layer NEVER calls any external API.
//   Layer 2: Granite LLM classifier — handles nuanced expressions
//            e.g. "I feel like disappearing" or "no point going on".
//
// Labels returned:
//   CRISIS   — immediate danger to life, show emergency resources immediately
//   DISTRESS — significant emotional distress, show support resources
//   SAFE     — no safety concern detected

const { classify } = require('./watsonxClient');

// ── LAYER 1: KEYWORD HARD RULES ───────────────────────────────────────────────
// Phrases that always trigger CRISIS regardless of context.
// This list is intentionally conservative — false positives result in showing
// resources, which is always safe. False negatives are the dangerous outcome.

const CRISIS_KEYWORDS = [
  'kill myself', 'killing myself',
  'end my life', 'end my own life',
  'take my life', 'taking my life',
  'commit suicide', 'committing suicide',
  'want to die', 'want to be dead',
  'wish i was dead', 'wish i were dead',
  'want to hurt myself', 'going to hurt myself',
  'not worth living', 'life is not worth',
  'overdose', 'slit my wrists',
  'jump off', 'hang myself',
  'no reason to live', 'nothing to live for',
];

const DISTRESS_KEYWORDS = [
  'self harm', 'self-harm', 'cutting myself', 'hurt myself',
  'feel like disappearing', 'dont want to be here',
  "don't want to be here", 'no point going on',
  'suicidal', 'suicide',
  'hopeless', 'helpless', 'trapped', 'unbearable',
  'cant take it anymore', "can't take it anymore",
];

function keywordLayer(text) {
  const lower = text.toLowerCase();
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) return 'CRISIS';
  }
  for (const kw of DISTRESS_KEYWORDS) {
    if (lower.includes(kw)) return 'DISTRESS';
  }
  return null;
}

// ── LAYER 2: LLM CLASSIFIER PROMPT ───────────────────────────────────────────
// Short, deterministic prompt. Temperature=0, max_new_tokens=5.
// The model must respond with exactly one word: SAFE, DISTRESS, or CRISIS.

function buildClassifyPrompt(text) {
  return `You are a mental health safety classifier. Classify the risk level of the following message.

Respond with EXACTLY one word — no explanation, no punctuation:
- CRISIS   : if the person expresses suicidal ideation, self-harm intent, or immediate danger
- DISTRESS : if the person expresses significant emotional distress, hopelessness, or depression  
- SAFE     : if the message does not indicate crisis or significant distress

Message: """${text.slice(0, 500)}"""

Classification:`;
}

function parseLabel(raw) {
  const upper = (raw || '').toUpperCase().trim();
  if (upper.startsWith('CRISIS'))   return 'CRISIS';
  if (upper.startsWith('DISTRESS')) return 'DISTRESS';
  return 'SAFE';
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Classify a user message for safety.
 *
 * @param {string} text  - the user's message
 * @returns {Promise<{ label: 'SAFE'|'DISTRESS'|'CRISIS', layer: 'keyword'|'llm' }>}
 */
async function classifyMessage(text) {
  if (!text || typeof text !== 'string') {
    return { label: 'SAFE', layer: 'keyword' };
  }

  // Layer 1: instant keyword check
  const kwResult = keywordLayer(text);
  if (kwResult) {
    return { label: kwResult, layer: 'keyword' };
  }

  // Layer 2: LLM classifier (only called when keywords don't match)
  try {
    const raw    = await classify(buildClassifyPrompt(text), { max_new_tokens: 5 });
    const label  = parseLabel(raw);
    return { label, layer: 'llm' };
  } catch (err) {
    // If the LLM classifier is unavailable (no creds yet, timeout, etc.)
    // we default to SAFE so the app still works — but log the failure.
    console.error('[safetyClassifier] LLM classify failed, defaulting SAFE:', err.message);
    return { label: 'SAFE', layer: 'keyword' };
  }
}

module.exports = { classifyMessage };
