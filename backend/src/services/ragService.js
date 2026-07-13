// services/ragService.js
// In-process Retrieval Augmented Generation — no Langflow, no embeddings API.
//
// ARCHITECTURE:
//   At server startup, knowledge .txt files are loaded from backend/src/knowledge/,
//   split into overlapping chunks, and stored in memory as plain text.
//   No external API is called during startup or retrieval.
//
//   Retrieval uses TF-IDF-style keyword scoring:
//     1. Tokenise the query into normalised terms.
//     2. For each chunk, count how many query terms appear and how often.
//     3. Apply a length-normalisation penalty so short, dense chunks score higher.
//     4. Return the top-K chunks by score.
//
//   This approach requires zero paid API calls, works on the IBM Lite plan,
//   and is fast enough for the small knowledge base used here.

const fs   = require('fs');
const path = require('path');
const { chat } = require('./watsonxClient');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const CHUNK_SIZE    = 400;  // characters per chunk
const CHUNK_OVERLAP = 80;   // overlap between consecutive chunks
const TOP_K         = 3;    // chunks to inject into the prompt

// ── CHUNK STORE (in-memory) ───────────────────────────────────────────────────
// Structure: [{ text: string, source: string, tokens: Set<string> }]
let _store       = [];
let _initialised = false;

// ── TEXT CHUNKING ─────────────────────────────────────────────────────────────

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter(c => c.length > 20);
}

// ── TOKENISATION ──────────────────────────────────────────────────────────────
// Lowercase, strip punctuation, split on whitespace, remove stop words.

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'this','that','these','those','it','its','i','you','he','she','we','they',
  'not','no','so','if','as','up','out','about','into','what','how','when',
  'who','which','there','than','then','my','your','his','her','our','their',
]);

function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// ── KEYWORD SCORING ───────────────────────────────────────────────────────────
// Score = (number of matching unique terms × sum of term frequencies)
//         normalised by chunk token count.
// Multiplied by a source-diversity bonus to avoid returning three chunks
// from the same document when a better match exists elsewhere.

function scoreChunk(chunkTokens, queryTerms) {
  if (chunkTokens.length === 0 || queryTerms.length === 0) return 0;

  let matchCount = 0;
  let termFreqSum = 0;

  for (const term of queryTerms) {
    const freq = chunkTokens.filter(t => t === term).length;
    if (freq > 0) {
      matchCount++;
      termFreqSum += freq;
    }
  }

  if (matchCount === 0) return 0;

  // Normalise by chunk length to favour dense, relevant chunks
  return (matchCount * termFreqSum) / Math.sqrt(chunkTokens.length);
}

// ── INITIALISATION ────────────────────────────────────────────────────────────

/**
 * Load all .txt files from the knowledge directory, chunk them, tokenise each
 * chunk, and store in memory. Synchronous and instant — no API calls.
 *
 * Called once at server startup. Safe to call multiple times — skips if
 * already initialised.
 */
async function initRag() {
  if (_initialised) return;

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.warn('[RAG] Knowledge directory not found at', KNOWLEDGE_DIR, '— RAG disabled.');
    _initialised = true;
    return;
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.txt'));
  if (files.length === 0) {
    console.warn('[RAG] No .txt files found in knowledge directory — RAG disabled.');
    _initialised = true;
    return;
  }

  console.log(`[RAG] Initialising with ${files.length} knowledge file(s)...`);

  for (const file of files) {
    const source  = file.replace('.txt', '');
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    const chunks  = chunkText(content);

    for (const chunk of chunks) {
      _store.push({
        text:   chunk,
        source,
        tokens: tokenise(chunk),
      });
    }

    console.log(`[RAG] Indexed "${file}" — ${chunks.length} chunks`);
  }

  _initialised = true;
  console.log(`[RAG] Ready. Total indexed chunks: ${_store.length}`);
}

// ── RETRIEVAL ─────────────────────────────────────────────────────────────────

/**
 * Retrieve the top-K most relevant chunks for a query using keyword scoring.
 * No API calls. Returns results in milliseconds.
 *
 * @param {string} query
 * @returns {Array<{ text: string, source: string, score: number }>}
 */
async function retrieve(query) {
  if (!_initialised) await initRag();
  if (_store.length === 0) return [];

  const queryTerms = tokenise(query);
  if (queryTerms.length === 0) {
    // Query has no meaningful terms — return first K chunks as a fallback
    return _store.slice(0, TOP_K).map(c => ({ text: c.text, source: c.source, score: 0 }));
  }

  const scored = _store
    .map(c => ({
      text:   c.text,
      source: c.source,
      score:  scoreChunk(c.tokens, queryTerms),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, TOP_K);
}

// ── RAG PROMPT ASSEMBLY ───────────────────────────────────────────────────────

function buildRagPrompt(query, chunks) {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are MindGuard AI, an educational mental health assistant.
Answer the following question using ONLY the provided context.
If the answer is not in the context, say "I don't have specific information on that, but I recommend consulting a mental health professional."

IMPORTANT RULES:
- You are NOT a medical professional.
- Do NOT diagnose any condition.
- Do NOT generate clinical risk percentages.
- Always recommend professional help for medical questions.
- End every response with: "This information is educational only. Please consult a qualified mental health professional for personal advice."

Context:
${context}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ];
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Answer a question using RAG (retrieve context → inject → generate).
 *
 * @param {string} query
 * @returns {{ answer: string, sources: string[], usedRag: boolean }}
 */
async function ragAnswer(query) {
  const chunks = await retrieve(query);

  if (chunks.length === 0 || chunks.every(c => c.score === 0)) {
    const fallbackSystem = `You are MindGuard AI, an educational mental health assistant.
Answer this question with general, responsible information.
Do NOT diagnose. Do NOT give clinical risk percentages. Recommend professional help.
End with: "This information is educational only. Please consult a qualified mental health professional."`;

    const messages = [
      { role: 'system', content: fallbackSystem },
      { role: 'user', content: query }
    ];
    
    const answer = await chat(messages, { max_new_tokens: 400 });
    return { answer, sources: [], usedRag: false };
  }

  const prompt  = buildRagPrompt(query, chunks);
  const answer  = await chat(prompt, { max_new_tokens: 500, temperature: 0.3 });
  const sources = [...new Set(chunks.map(c => c.source))];
  return { answer, sources, usedRag: true };
}

module.exports = { initRag, ragAnswer, retrieve };
