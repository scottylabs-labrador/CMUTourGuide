import { expect, jest, test } from '@jest/globals';
import { sendChatMessage, MAX_HISTORY_MESSAGES } from '../chatService';
import { Message } from '../../types/chat';

jest.mock('../../config/posthog', () => ({ posthog: { getDistinctId: () => 'device-1' } }));

test('sends only the recent tail so long chats stay under the backend cap', async () => {
  const fetchMock = jest.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => ({ reply: 'ok' }) }));
  global.fetch = fetchMock as unknown as typeof fetch;
  const messages: Message[] = Array.from({ length: 150 }, (_, i) => ({
    id: String(i), text: `m${i}`, isUser: i % 2 === 0, timestamp: new Date(),
  }));

  await expect(sendChatMessage(messages)).resolves.toBe('ok');
  const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).messages;
  expect(sent).toHaveLength(MAX_HISTORY_MESSAGES);
  expect(sent.at(-1).text).toBe('m149');
});
