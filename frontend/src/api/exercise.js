const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Log a completed exercise session to the backend.
 * @param {Object} payload { exerciseName, duration, completedAt, metadata }
 * @param {string} token - Session token
 */
export async function completeExercise(payload, token) {
  const resp = await fetch(`${API_URL}/exercises/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to complete exercise');
  }
  return resp.json();
}

/**
 * Get exercise history for the current session.
 * @param {string} token - Session token
 */
export async function getExerciseHistory(token) {
  const resp = await fetch(`${API_URL}/exercises/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch exercise history');
  }
  return resp.json();
}
