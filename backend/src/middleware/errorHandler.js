// middleware/errorHandler.js — Centralised error handling middleware.
//
// Express recognises a 4-argument middleware function as an error handler.
// Any route that does:  next(err)  will skip all normal routes and land here.
//
// In production we hide the stack trace from the client to avoid leaking
// internal details. In development we include it so you can debug quickly.

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[MindGuard][Error] ${statusCode} — ${err.message}`);
  if (isDev) console.error(err.stack);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred.',
    // Only include the stack trace when running locally
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
