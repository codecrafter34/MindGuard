// server.js — Entry point.
require('dotenv').config();

const app = require('./app');
const { initDatabases } = require('./services/dbInit');
const { initRag }       = require('./services/ragService');

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    // ── Cloudant ────────────────────────────────────────────────────────────
    if (process.env.CLOUDANT_URL && process.env.CLOUDANT_API_KEY) {
      await initDatabases();
    } else {
      console.warn('[MindGuard] Cloudant credentials not set — DB features disabled.');
    }

    // ── RAG knowledge base ──────────────────────────────────────────────────
    // Run asynchronously — don't block server startup.
    // RAG will be ready a few seconds after startup completes.
    if (process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID) {
      initRag().catch(err =>
        console.warn('[MindGuard] RAG initialisation failed (non-fatal):', err.message)
      );
    } else {
      console.warn('[MindGuard] watsonx.ai credentials not set — AI features disabled.');
    }

    app.listen(PORT, () => {
      console.log(`[MindGuard] Backend running on http://localhost:${PORT}`);
      console.log(`[MindGuard] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (err) {
    console.error('[MindGuard] Startup failed:', err.message);
    process.exit(1);
  }
})();
