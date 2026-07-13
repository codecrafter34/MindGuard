// routes/resources.js — GET /api/resources
//
// Returns verified mental health resources from Cloudant.
// Falls back to a hardcoded list if Cloudant is unavailable or empty
// (ensures the Resources page always shows something useful).

const express = require('express');
const { findDocuments, dbName } = require('../services/cloudantClient');

const router = express.Router();

// Hardcoded fallback — identical to the static list in the frontend.
// This list is the source of truth that dbInit seeds into Cloudant.
const FALLBACK_RESOURCES = [
  {
    id: 'icall',
    name: 'iCall Psychosocial Helpline (India)',
    category: 'crisis_helpline',
    phone: '9152987821',
    url: 'https://icallhelpline.org',
    description: 'Telephonic and chat-based counselling by trained mental health professionals.',
    languages: ['English', 'Hindi'],
    country: 'IN',
    available: '8 AM – 10 PM, Mon–Sat',
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation Helpline (India)',
    category: 'crisis_helpline',
    phone: '1860-2662-345',
    url: 'https://www.vandrevalafoundation.com',
    description: '24/7 free mental health support via phone.',
    languages: ['English', 'Hindi'],
    country: 'IN',
    available: '24/7',
  },
  {
    id: 'nimhans',
    name: 'NIMHANS (India)',
    category: 'professional',
    phone: '080-46110007',
    url: 'https://nimhans.ac.in',
    description: 'National Institute of Mental Health and Neuro Sciences.',
    languages: ['English', 'Kannada'],
    country: 'IN',
    available: 'Business hours',
  },
  {
    id: 'who',
    name: 'WHO Mental Health Resources',
    category: 'educational',
    phone: null,
    url: 'https://www.who.int/health-topics/mental-health',
    description: 'Authoritative global mental health facts and guides.',
    languages: ['Multiple'],
    country: 'GLOBAL',
  },
  {
    id: 'nimh',
    name: 'NIMH (USA)',
    category: 'educational',
    phone: '1-866-615-6464',
    url: 'https://www.nimh.nih.gov',
    description: 'National Institute of Mental Health — evidence-based information.',
    languages: ['English', 'Spanish'],
    country: 'US',
  },
];

/**
 * GET /api/resources
 *
 * No authentication required — resources are public.
 *
 * Response 200:
 * { "resources": [...], "source": "cloudant"|"fallback" }
 */
router.get('/resources', async (req, res, next) => {
  try {
    let resources;
    let source = 'cloudant';

    try {
      const docs = await findDocuments(dbName('resources'), { type: 'resource' }, 50);
      if (docs.length > 0) {
        resources = docs.map(d => ({
          id:          d._id,
          name:        d.name,
          category:    d.category,
          phone:       d.phone || null,
          url:         d.url,
          description: d.description,
          languages:   d.languages || [],
          country:     d.country || 'GLOBAL',
          available:   d.available || null,
        }));
      } else {
        throw new Error('empty');
      }
    } catch {
      // Cloudant unavailable or empty — use fallback
      resources = FALLBACK_RESOURCES;
      source = 'fallback';
    }

    return res.status(200).json({ resources, source });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
