const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Save a new mood to the backend.
 * @param {Object} payload { mood, emoji, intensity, note, timestamp }
 * @param {string} token - Session token
 */
export async function submitMood(payload, token) {
  const resp = await fetch(`${API_URL}/mood`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit mood');
  }
  return resp.json();
}

/**
 * Get mood history for the current session.
 * @param {string} token - Session token
 */
export async function getMoodHistory(token) {
  const resp = await fetch(`${API_URL}/mood/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch history');
  }
  return resp.json();
}

/**
 * Generate AI Insight and run safety checks.
 * @param {Object} payload { mood, intensity, note }
 * @param {string} token - Session token
 */
export async function getMoodRecommendation(payload, token) {
  const resp = await fetch(`${API_URL}/mood/recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to get recommendation');
  }
  return resp.json();
}
