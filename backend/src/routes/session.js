// routes/session.js — POST /api/session
//
// Creates an anonymous session for a new user.
//
// WHY anonymous sessions?
//   Mental health applications should collect the minimum necessary data.
//   We never ask for a name, email, or password. Instead we issue a random
//   token (like a temporary ID card). The user keeps the token; we store
//   only a hash of it (a one-way fingerprint). This means even if the
//   Cloudant database were leaked, the raw tokens would not be exposed.
//
// TOKEN FLOW:
//   1. Server generates a cryptographically random 32-byte token.
//   2. Server hashes the token with SHA-256 (stored in Cloudant).
//   3. Server signs the token with HMAC-SHA-256 using SESSION_SECRET
//      (returned to the client as the "session token").
//   4. On future requests the client sends the signed token in the
//      Authorization header. The backend verifies the signature, then
//      hashes the inner token to look up the session in Cloudant.
//
// WHAT IS STORED IN CLOUDANT?
//   Only the SHA-256 hash of the raw token, the creation timestamp,
//   and a locale string. Nothing that identifies the real person.

const express = require('express');
const crypto = require('crypto'); // built-in Node.js module, no install needed

const { insertDocument, dbName } = require('../services/cloudantClient');

const router = express.Router();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random hex string of `byteLength` bytes.
 * 32 bytes = 64 hex characters = 256 bits of entropy. Very hard to guess.
 */
function generateToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Hash a token with SHA-256. The hash is stored in Cloudant.
 * SHA-256 is a one-way function: you cannot recover the original token
 * from the hash, but you CAN verify "does this token match this hash?"
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sign a token using HMAC-SHA-256 with the SESSION_SECRET.
 * The returned value is what we send back to the client.
 * Format: "<raw-token>.<hmac-signature>"
 *
 * The signature lets us verify later that the token was issued by us
 * (not forged by the client). This is a lightweight alternative to JWT.
 */
function signToken(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set.');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');

  return `${token}.${signature}`;
}

/**
 * Verify a signed token.
 * Returns the raw token if the signature is valid, or null if it is not.
 */
function verifySignedToken(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return null;

  const lastDot = signedToken.lastIndexOf('.');
  if (lastDot === -1) return null;

  const rawToken = signedToken.substring(0, lastDot);
  const providedSig = signedToken.substring(lastDot + 1);

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawToken)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks.
  // Compare the raw hex strings as UTF-8 buffers so that a different
  // string length (e.g. an appended character) is always detected.
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  const providedBuf = Buffer.from(providedSig, 'utf8');

  if (expectedBuf.length !== providedBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) return null;

  return rawToken;
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

/**
 * POST /api/session
 *
 * Creates an anonymous session. No request body is required.
 * An optional `locale` field may be provided (e.g. "en", "hi").
 *
 * Response 201:
 * {
 *   "sessionToken": "<signed-token>",   ← client must store and send this
 *   "sessionId":    "<cloudant-doc-id>",
 *   "expiresAt":    "<ISO8601>"
 * }
 *
 * The client should store sessionToken in localStorage or sessionStorage
 * and include it as:  Authorization: Bearer <sessionToken>
 * on every subsequent request that requires authentication.
 */
router.post('/session', async (req, res, next) => {
  try {
    const locale = req.body?.locale || 'en';

    // 1. Generate a fresh random token.
    const rawToken = generateToken();

    // 2. Compute the hash that we will store in Cloudant.
    const tokenHash = hashToken(rawToken);

    // 3. Sessions expire after 24 hours. Compute the expiry timestamp now.
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    // 4. Build the Cloudant document. NOTE: we store the HASH, not the token.
    const sessionDoc = {
      type: 'session',
      token_hash: tokenHash,      // SHA-256 of the raw token
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      consent_given: false,        // updated by POST /api/consent
      locale,
    };

    // 5. Save to Cloudant. insertDocument returns { id, rev, ok }.
    const saved = await insertDocument(dbName('sessions'), sessionDoc);

    // 6. Sign the token for the client (never send the raw token alone —
    //    the signature lets us reject forged tokens).
    const sessionToken = signToken(rawToken);

    // 7. Return the signed token + session metadata.
    //    The sessionId lets the client correlate future requests.
    res.status(201).json({
      sessionToken,
      sessionId: saved.id,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (err) {
    // Pass to the centralised error handler in middleware/errorHandler.js
    next(err);
  }
});

// Export both the router AND verifySignedToken on the same object.
// verifySignedToken is used by the consent route and later by auth middleware.
router.verifySignedToken = verifySignedToken;
module.exports = router;
