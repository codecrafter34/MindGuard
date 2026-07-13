// frontend/src/api/resources.js
import { api } from './client';

export async function getResources() {
  return api.get('/resources');
}
