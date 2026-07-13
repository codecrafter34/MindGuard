// services/dbInit.js — Bootstrap all required Cloudant databases.
// Called once at server startup. Idempotent — safe to run repeatedly.

const { ensureDatabase, dbName, insertDocument, findDocuments } = require('./cloudantClient');

const REQUIRED_DATABASES = [
  'sessions',
  'resources',
  'journals',
  'checkins',
  'moods',
  'exercises',
  'conversations',
  'safety_events',
];

// Verified resources to seed on first run
const SEED_RESOURCES = [
  {
    _id: 'resource_icall',
    type: 'resource',
    name: 'iCall Psychosocial Helpline (India)',
    category: 'crisis_helpline',
    phone: '9152987821',
    url: 'https://icallhelpline.org',
    description: 'Telephonic and chat-based counselling by trained mental health professionals.',
    languages: ['English', 'Hindi'],
    country: 'IN',
    available: '8 AM – 10 PM, Mon–Sat',
    verified: true,
  },
  {
    _id: 'resource_vandrevala',
    type: 'resource',
    name: 'Vandrevala Foundation Helpline (India)',
    category: 'crisis_helpline',
    phone: '1860-2662-345',
    url: 'https://www.vandrevalafoundation.com',
    description: '24/7 free mental health support via phone.',
    languages: ['English', 'Hindi'],
    country: 'IN',
    available: '24/7',
    verified: true,
  },
  {
    _id: 'resource_nimhans',
    type: 'resource',
    name: 'NIMHANS (India)',
    category: 'professional',
    phone: '080-46110007',
    url: 'https://nimhans.ac.in',
    description: 'National Institute of Mental Health and Neuro Sciences.',
    languages: ['English', 'Kannada'],
    country: 'IN',
    available: 'Business hours',
    verified: true,
  },
  {
    _id: 'resource_who',
    type: 'resource',
    name: 'WHO Mental Health Resources',
    category: 'educational',
    phone: null,
    url: 'https://www.who.int/health-topics/mental-health',
    description: 'Authoritative global mental health facts and guides.',
    languages: ['Multiple'],
    country: 'GLOBAL',
    verified: true,
  },
  {
    _id: 'resource_nimh',
    type: 'resource',
    name: 'NIMH (USA)',
    category: 'educational',
    phone: '1-866-615-6464',
    url: 'https://www.nimh.nih.gov',
    description: 'National Institute of Mental Health — evidence-based information.',
    languages: ['English', 'Spanish'],
    country: 'US',
    verified: true,
  },
];

async function seedResources() {
  const db  = dbName('resources');
  const existing = await findDocuments(db, { type: 'resource' }, 1);
  if (existing.length > 0) return; // already seeded

  for (const resource of SEED_RESOURCES) {
    try {
      await insertDocument(db, resource);
    } catch (err) {
      // Duplicate _id on re-seed — ignore
      if (!err.message?.includes('conflict')) {
        console.warn('[dbInit] Seed resource failed:', err.message);
      }
    }
  }
  console.log('[Cloudant] Resources database seeded with', SEED_RESOURCES.length, 'entries.');
}

async function initDatabases() {
  console.log('[Cloudant] Checking required databases...');

  for (const shortName of REQUIRED_DATABASES) {
    const fullName = dbName(shortName);
    const result   = await ensureDatabase(fullName);
    console.log(`[Cloudant] Database "${fullName}": ${result}`);
  }

  await seedResources();
  console.log('[Cloudant] All databases ready.');
}

module.exports = { initDatabases };
