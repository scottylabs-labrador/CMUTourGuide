import { ENDPOINTS } from '../constants/api';
import { Message } from '../types/chat';
import { fetchWithTimeout, CHAT_TIMEOUT_MS } from './http';

export async function sendChatMessage(
  messages: Message[],
  buildingId?: string,
): Promise<string> {
  const res = await fetchWithTimeout(ENDPOINTS.chat, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, building_id: buildingId }),
  }, CHAT_TIMEOUT_MS);

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
