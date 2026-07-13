// services/cloudantClient.js — Reusable IBM Cloudant client module.
//
// This file is the ONLY place in the codebase that touches the Cloudant SDK.
// All other modules import the helpers exported here instead of using the
// SDK directly. This keeps the Cloudant API surface in one place so it is
// easy to update or swap later.
//
// Authentication: the IBM Cloudant SDK reads CLOUDANT_URL and CLOUDANT_APIKEY
// from the environment automatically when you use IamAuthenticator.
// We still validate those variables explicitly on startup so you get a clear
// error message instead of a cryptic SDK failure.
//
// CLOUDANT_DB_PREFIX lets every database name be namespaced, e.g.
// "mindguard_sessions" instead of just "sessions". This avoids name
// collisions if the same Cloudant account is used for multiple projects.

const { CloudantV1 } = require('@ibm-cloud/cloudant');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');

// ─── CONFIG VALIDATION ────────────────────────────────────────────────────────
// Fail fast at startup if the required environment variables are missing.
// Better to crash immediately with a clear message than to fail silently on
// the first database call.

function validateConfig() {
  const missing = [];
  if (!process.env.CLOUDANT_URL)     missing.push('CLOUDANT_URL');
  if (!process.env.CLOUDANT_API_KEY) missing.push('CLOUDANT_API_KEY');

  if (missing.length > 0) {
    // We throw here so server.js can catch it and print a helpful message.
    throw new Error(
      `[Cloudant] Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your IBM Cloudant credentials.'
    );
  }
}

// ─── CLIENT SINGLETON ─────────────────────────────────────────────────────────
// We create one client instance and reuse it for all requests.
// Recreating it on every request would be wasteful and slower.

let _client = null;

function getClient() {
  if (_client) return _client;

  validateConfig();

  _client = new CloudantV1({
    authenticator: new IamAuthenticator({
      apikey: process.env.CLOUDANT_API_KEY,
    }),
    serviceUrl: process.env.CLOUDANT_URL,
  });

  return _client;
}

// ─── DB NAME HELPER ───────────────────────────────────────────────────────────
// Returns the full database name with the project prefix applied.
// Usage:  dbName('sessions')  →  'mindguard_sessions'

function dbName(shortName) {
  const prefix = process.env.CLOUDANT_DB_PREFIX || 'mindguard_';
  return `${prefix}${shortName}`;
}

// ─── DATABASE OPERATIONS ──────────────────────────────────────────────────────

/**
 * Check whether a database exists.
 * Returns true if it does, false if it does not (404), throws on other errors.
 */
async function databaseExists(name) {
  try {
    await getClient().getDatabaseInformation({ db: name });
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

/**
 * Create a database if it does not already exist.
 * Returns 'created' or 'exists'.
 */
async function ensureDatabase(name) {
  const exists = await databaseExists(name);
  if (exists) return 'exists';

  await getClient().putDatabase({ db: name });
  console.log(`[Cloudant] Created database: ${name}`);
  return 'created';
}

// ─── DOCUMENT OPERATIONS ──────────────────────────────────────────────────────

/**
 * Insert a new document into a database.
 * `doc` must be a plain JS object. The `_id` field is optional —
 * Cloudant will generate one if it is omitted.
 * Returns the Cloudant response which includes the `id` and `rev`.
 */
async function insertDocument(db, doc) {
  const result = await getClient().postDocument({
    db,
    document: doc,
  });
  return result.result;
}

/**
 * Retrieve a single document by its _id.
 * Throws a 404 error if the document does not exist.
 */
async function getDocument(db, id) {
  const result = await getClient().getDocument({ db, docId: id });
  return result.result;
}

/**
 * Find documents in a database using a Cloudant Query selector.
 * `selector` is a Mango query object, e.g. { type: 'session' }.
 * `limit` controls the maximum number of results returned (default 25).
 */
async function findDocuments(db, selector, limit = 25) {
  const result = await getClient().postFind({
    db,
    selector,
    limit,
  });
  return result.result.docs;
}

/**
 * Run a lightweight ping against the Cloudant server.
 * Used by the health check endpoint to confirm connectivity.
 * Returns the server information object on success.
 */
async function ping() {
  const result = await getClient().getServerInformation();
  return result.result;
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  getClient,
  dbName,
  databaseExists,
  ensureDatabase,
  insertDocument,
  getDocument,
  findDocuments,
  ping,
};
