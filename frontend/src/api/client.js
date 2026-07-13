// frontend/src/api/client.js
// Base axios-like fetch wrapper. Uses the native browser fetch API
// (no extra dependencies). The Vite proxy forwards /api/* to localhost:3001.

const BASE = '/api';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

export const api = {
  get:  (path, token)        => request('GET',  path, null, token),
  post: (path, body, token)  => request('POST', path, body, token),
};
