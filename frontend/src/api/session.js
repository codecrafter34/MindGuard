// frontend/src/api/session.js
import { api } from './client';

export async function createSession(locale = 'en') {
  return api.post('/session', { locale });
}

export async function recordConsent(token, consentVersion = '1.0') {
  return api.post('/consent', { consentVersion }, token);
}
