// routes/consent.js — POST /api/consent
// Records that the user has acknowledged all disclaimers.
// Requires a valid Bearer session token (validated by auth middleware).

const express = require('express');
const { requireSession } = require('../middleware/auth');
const { getClient, dbName } = require('../services/cloudantClient');

const router = express.Router();

/**
 * POST /api/consent
 *
 * Headers:  Authorization: Bearer <sessionToken>
 * Body:     { "consentVersion": "1.0" }   (optional)
 *
 * Response 200:
 * { "status": "ok", "message": "Consent recorded.", "consentTimestamp": "..." }
 */
router.post('/consent', requireSession, async (req, res, next) => {
  try {
    const consentVersion   = req.body?.consentVersion || '1.0';
    const consentTimestamp = new Date().toISOString();

    // Find session document by token hash
    const client     = getClient();
    const findResult = await client.postFind({
      db: dbName('sessions'),
      selector: { type: 'session', token_hash: req.sessionHash },
      limit: 1,
    });

    const docs = findResult.result.docs;

    if (docs.length === 0) {
      return res.status(404).json({
        status:  'error',
        message: 'Session not found. Please call POST /api/session first.',
      });
    }

    const doc = docs[0];

    if (new Date(doc.expires_at) < new Date()) {
      return res.status(401).json({
        status:  'error',
        message: 'Session has expired. Please call POST /api/session to get a new one.',
      });
    }

    await client.putDocument({
      db:    dbName('sessions'),
      docId: doc._id,
      document: {
        ...doc,
        consent_given:     true,
        consent_timestamp: consentTimestamp,
        consent_version:   consentVersion,
      },
    });

    res.status(200).json({
      status:           'ok',
      message:          'Consent recorded.',
      consentTimestamp,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
