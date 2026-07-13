// routes/health.js
// GET /api/health          — always-on liveness probe
// GET /api/health/cloudant — deep Cloudant connectivity + all 6 databases
// GET /api/health/watsonx  — confirms watsonx.ai IAM token exchange works

const express = require('express');
const { ping, databaseExists, dbName } = require('../services/cloudantClient');

const router  = express.Router();

const ALL_DBS = ['sessions', 'resources', 'journals', 'checkins', 'conversations', 'safety_events'];

// ── GET /api/health ───────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status:      'ok',
    service:     'MindGuard AI Backend',
    version:     '2.0.0',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── GET /api/health/cloudant ──────────────────────────────────────────────────
router.get('/health/cloudant', async (req, res) => {
  try {
    const serverInfo = await ping();

    const dbChecks = await Promise.all(
      ALL_DBS.map(async (s) => {
        const full   = dbName(s);
        const exists = await databaseExists(full);
        return { database: full, exists };
      })
    );

    const allExist = dbChecks.every(d => d.exists);

    res.status(allExist ? 200 : 503).json({
      status:           allExist ? 'ok' : 'degraded',
      cloudant_version: serverInfo.version || 'unknown',
      databases:        dbChecks,
      timestamp:        new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Health/Cloudant]', err.message);
    res.status(503).json({
      status:    'unavailable',
      message:   'Cloudant unreachable. Check CLOUDANT_URL and CLOUDANT_API_KEY.',
      timestamp: new Date().toISOString(),
    });
  }
});

// ── GET /api/health/watsonx ───────────────────────────────────────────────────
// Validates the IAM token exchange without calling a model.
router.get('/health/watsonx', async (req, res) => {
  if (!process.env.WATSONX_API_KEY || !process.env.WATSONX_PROJECT_ID) {
    return res.status(503).json({
      status:  'unconfigured',
      message: 'WATSONX_API_KEY and WATSONX_PROJECT_ID are not set.',
    });
  }

  try {
    const axios = require('axios');
    const resp  = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: process.env.WATSONX_API_KEY,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    res.status(200).json({
      status:     'ok',
      iam:        'token_exchange_successful',
      expires_in: resp.data.expires_in,
      project_id: process.env.WATSONX_PROJECT_ID,
      chat_model: process.env.WATSONX_CHAT_MODEL     || 'ibm/granite-13b-chat-v2',
      classify_model: process.env.WATSONX_CLASSIFY_MODEL || 'ibm/granite-7b-instruct',
      timestamp:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Health/watsonx]', err.message);
    res.status(503).json({
      status:  'unavailable',
      message: 'IBM IAM token exchange failed. Check WATSONX_API_KEY.',
    });
  }
});

module.exports = router;
