// app.js — Express application factory.
// Registers all middleware and routes.

const express = require('express');
const cors    = require('cors');

const healthRouter  = require('./routes/health');
const sessionRouter = require('./routes/session');
const consentRouter = require('./routes/consent');
const chatRouter    = require('./routes/chat');
const ragChatRouter = require('./routes/ragChat');
const journalRouter = require('./routes/journal');
const checkinRouter = require('./routes/checkin');
const moodRouter    = require('./routes/mood');
const exerciseRouter = require('./routes/exercise');
const resourcesRouter = require('./routes/resources');
const errorHandler  = require('./middleware/errorHandler');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api', sessionRouter);
app.use('/api', consentRouter);
app.use('/api', chatRouter);
app.use('/api', ragChatRouter);
app.use('/api', journalRouter);
app.use('/api', checkinRouter);
app.use('/api', moodRouter);
app.use('/api', exerciseRouter);
app.use('/api', resourcesRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── CENTRALISED ERROR HANDLER ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
