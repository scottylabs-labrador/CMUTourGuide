import { ENDPOINTS } from '../constants/api';
import { Message } from '../types/chat';
import { fetchWithTimeout, CHAT_TIMEOUT_MS } from './http';
import { posthog } from '../config/posthog';

export async function sendChatMessage(
  messages: Message[],
  buildingId?: string,
  sessionId?: string,
): Promise<string> {
  const res = await fetchWithTimeout(ENDPOINTS.chat, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // ids let the backend's LLM traces join this device's PostHog events
    body: JSON.stringify({
      messages,
      building_id: buildingId,
      distinct_id: posthog.getDistinctId(),
      session_id: sessionId,
    }),
  }, CHAT_TIMEOUT_MS);

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
