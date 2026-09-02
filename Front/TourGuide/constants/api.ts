export const API_BASE_URL = 'https://cmutourguide-backend-production.up.railway.app';

export const ENDPOINTS = {
  vision: `${API_BASE_URL}/vision`,
  chat: `${API_BASE_URL}/chat`,
  feedback: `${API_BASE_URL}/feedback`,
} as const;
