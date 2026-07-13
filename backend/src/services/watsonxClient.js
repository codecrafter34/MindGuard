// services/watsonxClient.js
// Central IBM watsonx.ai API client.
// All watsonx.ai calls go through this file — no other file touches the API directly.
//
// Uses the watsonx.ai REST API directly with axios.
// No external SDKs required — only the IBM API key, project ID, and regional URL.
//
// MODEL FALLBACK:
//   If WATSONX_CHAT_MODEL or WATSONX_CLASSIFY_MODEL is not set, we default to
//   ibm/granite-13b-chat-v2 and ibm/granite-7b-instruct respectively.
//   If a Granite model call fails with 404/422 (model not found in region),
//   we automatically retry with meta-llama/llama-3-1-8b-instruct which is
//   available across all IBM Cloud regions.

const axios = require('axios');

// ── CONFIG ────────────────────────────────────────────────────────────────────

const WATSONX_URL    = process.env.WATSONX_URL     || 'https://us-south.ml.cloud.ibm.com';
const PROJECT_ID     = process.env.WATSONX_PROJECT_ID;
const API_KEY        = process.env.WATSONX_API_KEY;
const CHAT_MODEL     = process.env.WATSONX_CHAT_MODEL     || 'ibm/granite-13b-chat-v2';
const CLASSIFY_MODEL = process.env.WATSONX_CLASSIFY_MODEL || 'ibm/granite-7b-instruct';
const FALLBACK_MODEL = 'meta-llama/llama-3-3-70b-instruct';

const GENERATE_URL = `${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`;
const CHAT_URL = `${WATSONX_URL}/ml/v1/text/chat?version=2023-05-29`;

// ── IAM TOKEN CACHE ───────────────────────────────────────────────────────────
// IBM IAM tokens expire after ~1 hour. We cache and refresh only when within
// 5 minutes of expiry — avoiding a round-trip on every call.

let _iamToken  = null;
let _iamExpiry = 0;

async function getIamToken() {
  if (_iamToken && Date.now() < _iamExpiry - 5 * 60 * 1000) {
    return _iamToken;
  }

  if (!API_KEY) {
    throw new Error('WATSONX_API_KEY is not set. Add it to your .env file.');
  }

  const resp = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: API_KEY,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  _iamToken  = resp.data.access_token;
  _iamExpiry = Date.now() + resp.data.expires_in * 1000;
  return _iamToken;
}

// ── CORE GENERATE ─────────────────────────────────────────────────────────────

/**
 * Call the watsonx.ai text generation endpoint.
 *
 * @param {string} modelId  - e.g. 'ibm/granite-13b-chat-v2'
 * @param {string} prompt   - full prompt string
 * @param {object} params   - generation parameters
 * @returns {string}        - generated text string
 */
async function generate(modelId, prompt, params = {}) {
  if (!PROJECT_ID) {
    throw new Error('WATSONX_PROJECT_ID is not set. Add it to your .env file.');
  }

  const token = await getIamToken();

  const body = {
    model_id:   modelId,
    input:      prompt,
    project_id: PROJECT_ID,
    parameters: {
      max_new_tokens:     params.max_new_tokens     ?? 512,
      min_new_tokens:     params.min_new_tokens     ?? 1,
      temperature:        params.temperature        ?? 0.7,
      top_p:              params.top_p              ?? 0.9,
      repetition_penalty: params.repetition_penalty ?? 1.1,
      stop_sequences:     params.stop_sequences     ?? [],
    },
  };

  try {
    const resp = await axios.post(GENERATE_URL, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const generated = resp.data?.results?.[0]?.generated_text || '';
    return generated.trim();

  } catch (err) {
    const status = err.response?.status;
    if ((status === 404 || status === 422) && modelId !== FALLBACK_MODEL) {
      console.warn(
        `[watsonx] Model "${modelId}" unavailable (${status}). ` +
        `Retrying with fallback: ${FALLBACK_MODEL}`
      );
      return generate(FALLBACK_MODEL, prompt, params);
    }
    throw buildWatsonxError(err, GENERATE_URL, modelId);
  }
}

// ── CORE CHAT ─────────────────────────────────────────────────────────────────

/**
 * Call the watsonx.ai text chat endpoint.
 *
 * @param {string} modelId  - e.g. 'ibm/granite-13b-chat-v2'
 * @param {Array} messages  - array of message objects { role, content }
 * @param {object} params   - generation parameters
 * @returns {string}        - generated text string
 */
async function chatAPI(modelId, messages, params = {}) {
  if (!PROJECT_ID) {
    throw new Error('WATSONX_PROJECT_ID is not set. Add it to your .env file.');
  }

  const token = await getIamToken();

  const body = {
    model_id:   modelId,
    messages:   messages,
    project_id: PROJECT_ID,
    max_tokens: params.max_new_tokens ?? 512,
    temperature: params.temperature ?? 0.7,
    top_p: params.top_p ?? 0.9,
    repetition_penalty: params.repetition_penalty ?? 1.1,
  };

  try {
    const resp = await axios.post(CHAT_URL, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const generated = resp.data?.choices?.[0]?.message?.content || '';
    return generated.trim();

  } catch (err) {
    const status = err.response?.status;
    if ((status === 404 || status === 422) && modelId !== FALLBACK_MODEL) {
      console.warn(
        `[watsonx] Model "${modelId}" unavailable (${status}). ` +
        `Retrying with fallback: ${FALLBACK_MODEL}`
      );
      return chatAPI(FALLBACK_MODEL, messages, params);
    }
    throw buildWatsonxError(err, CHAT_URL, modelId);
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Generate a chat response using the configured chat model.
 */
async function chat(messages, params = {}) {
  return chatAPI(CHAT_MODEL, messages, params);
}

/**
 * Run a short classify task using the smaller classify model.
 * Deterministic: temperature=0, max_new_tokens=20 by default.
 */
async function classify(prompt, params = {}) {
  return generate(CLASSIFY_MODEL, prompt, {
    max_new_tokens:     20,
    temperature:        0,
    top_p:              1,
    repetition_penalty: 1.0,
    ...params,
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function buildWatsonxError(err, endpoint, modelId) {
  const status  = err.response?.status || 500;
  const ibmError = err.response?.data?.errors?.[0];
  const code = ibmError?.code || 'unknown_error';
  const message = ibmError?.message
    || err.response?.data?.message
    || err.message
    || 'watsonx.ai API error';
  const traceId = err.response?.data?.trace || 'N/A';

  console.error(`\n[MindGuard][watsonx API Error]
  HTTP Status     : ${status}
  IBM Error Code  : ${code}
  IBM Trace ID    : ${traceId}
  Request Endpoint: ${endpoint}
  Model           : ${modelId}
  Project ID      : ${PROJECT_ID}
  Region          : ${WATSONX_URL}
  Message         : ${message}\n`);

  const out = new Error(`[watsonx] ${message}`);
  out.statusCode = status >= 400 && status < 500 ? 503 : 500;
  return out;
}

module.exports = { chat, classify, generate };
