import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useChatSession } from '../useChatSession';
import { sendChatMessage } from '../../services/chatService';
import { saveChatSession, getChatSession } from '../../utils/chatStorage';

jest.mock('../../services/chatService', () => ({ sendChatMessage: jest.fn() }));
jest.mock('../../utils/chatStorage', () => ({ saveChatSession: jest.fn(), getChatSession: jest.fn() }));

const send = sendChatMessage as jest.MockedFunction<typeof sendChatMessage>;
const save = saveChatSession as jest.MockedFunction<typeof saveChatSession>;
const load = getChatSession as jest.MockedFunction<typeof getChatSession>;

beforeEach(() => { jest.clearAllMocks(); });

test('opening a chat without sending does not save a session', async () => {
  await renderHook(() => useChatSession({ buildingId: 'GHC', buildingName: 'Gates' }));
  expect(save).not.toHaveBeenCalled();
});

test('a session is saved once the user sends a message', async () => {
  send.mockResolvedValue('reply');
  const { result } = await renderHook(() => useChatSession({ buildingId: 'GHC', buildingName: 'Gates' }));
  await act(() => result.current.sendMessage('hi'));
  expect(save).toHaveBeenCalled();
  expect(save.mock.calls.at(-1)![0].messages.map((m) => m.text)).toContain('hi');
});

test('reopening a chat never overwrites it with the greeting-only state', async () => {
  load.mockResolvedValue({
    id: 's1', createdAt: '', updatedAt: '', buildingId: 'GHC',
    messages: [{ id: 'u', text: 'old question', isUser: true, timestamp: new Date() }],
  });
  await renderHook(() => useChatSession({ sessionId: 's1' }));
  for (const [session] of save.mock.calls) expect(session.messages.some((m) => m.isUser)).toBe(true);
});

test('a second send while a reply is pending is ignored', async () => {
  let resolve!: (r: string) => void;
  send.mockReturnValue(new Promise((r) => { resolve = r; }));
  const { result } = await renderHook(() => useChatSession({ buildingId: 'GHC', buildingName: 'Gates' }));
  await act(async () => {
    result.current.sendMessage('first');
    result.current.sendMessage('second');
  });
  expect(send).toHaveBeenCalledTimes(1);
  await act(async () => resolve('answer'));
  expect(result.current.messages.map((m) => m.text).slice(1)).toEqual(['first', 'answer']);
});
