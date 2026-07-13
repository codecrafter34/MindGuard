// frontend/src/api/journal.js
import { api } from './client';

export async function submitJournalEntry(entryText, token) {
  return api.post('/journal', { entryText }, token);
}

export async function getJournalEntries(token, limit = 10) {
  return api.get(`/journal?limit=${limit}`, token);
}
