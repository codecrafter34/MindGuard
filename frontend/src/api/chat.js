// frontend/src/api/chat.js
import { api } from './client';

export async function sendChatMessage(message, token) {
  return api.post('/chat', { message, includeHistory: true }, token);
}

export async function sendRagMessage(message, token) {
  return api.post('/rag-chat', { message }, token);
}
