// middleware/auth.js
// Verifies the signed session token on every authenticated request.
//
// Usage in a route file:
//   const { requireSession } = require('../middleware/auth');
//   router.post('/journal', requireSession, async (req, res) => { ... });
//
// If the token is valid, req.sessionHash and req.sessionToken are set
// so route handlers can use them without re-parsing the header.

const crypto = require('crypto');

function verifySignedToken(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return null;

  const lastDot = signedToken.lastIndexOf('.');
  if (lastDot === -1) return null;

  const rawToken   = signedToken.substring(0, lastDot);
  const providedSig = signedToken.substring(lastDot + 1);

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawToken)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  const providedBuf = Buffer.from(providedSig, 'utf8');
  if (expectedBuf.length !== providedBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) return null;

  return rawToken;
}

/**
 * Express middleware: requires a valid Bearer session token.
 * Sets req.sessionHash (SHA-256 of raw token) for downstream handlers.
 */
function requireSession(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authorization required. Include: Authorization: Bearer <sessionToken>',
    });
  }

  const signedToken = authHeader.slice(7);
  const rawToken    = verifySignedToken(signedToken);

  if (!rawToken) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session token. Please call POST /api/session to get a new one.',
    });
  }

  // Attach the token hash so routes can query Cloudant by hash
  req.sessionHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
  req.sessionToken = signedToken;
  next();
}

module.exports = { requireSession, verifySignedToken };
