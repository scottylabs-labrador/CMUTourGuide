import { ENDPOINTS } from '../constants/api';
import { Message } from '../types/chat';

export async function sendChatMessage(messages: Message[]): Promise<string> {
  const res = await fetch(ENDPOINTS.chat, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
