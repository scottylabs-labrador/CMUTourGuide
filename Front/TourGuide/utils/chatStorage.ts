import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatSession } from '../types/chat';

const SESSIONS_KEY = 'chat_sessions';
const SESSION_PREFIX = 'chat_session:';

export const saveChatSession = async (session: ChatSession) => {
  // Serialize Date objects to ISO strings for storage
  const sessionToSave = {
    ...session,
    messages: session.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    })),
  };

  await AsyncStorage.setItem(
    `${SESSION_PREFIX}${session.id}`,
    JSON.stringify(sessionToSave)
  );

  const sessionIds = await AsyncStorage.getItem(SESSIONS_KEY);
  const ids: string[] = sessionIds ? JSON.parse(sessionIds) : [];
  if (!ids.includes(session.id)) {
    ids.unshift(session.id);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(ids));
  }
};

export const getChatSession = async (id: string): Promise<ChatSession | null> => {
  const data = await AsyncStorage.getItem(`${SESSION_PREFIX}${id}`);
  if (!data) return null;

  const session: ChatSession = JSON.parse(data);
  // Convert ISO strings back to Date objects
  session.messages = session.messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));

  return session;
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  const sessionIds = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!sessionIds) return [];

  const ids: string[] = JSON.parse(sessionIds);
  const sessions = await Promise.all(
    ids.map(id => getChatSession(id))
  );

  return sessions.filter((s): s is ChatSession => s !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const deleteChatSession = async (id: string): Promise<void> => {
  // Remove the session data
  await AsyncStorage.removeItem(`${SESSION_PREFIX}${id}`);

  // Remove the session ID from the list
  const sessionIds = await AsyncStorage.getItem(SESSIONS_KEY);
  if (sessionIds) {
    const ids: string[] = JSON.parse(sessionIds);
    const updatedIds = ids.filter(sessionId => sessionId !== id);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedIds));
  }
};

export const clearAllChatSessions = async (): Promise<void> => {
  // Get all session IDs
  const sessionIds = await AsyncStorage.getItem(SESSIONS_KEY);
  if (sessionIds) {
    const ids: string[] = JSON.parse(sessionIds);

    // Remove each session
    await Promise.all(
      ids.map(id => AsyncStorage.removeItem(`${SESSION_PREFIX}${id}`))
    );
  }

  // Clear the session IDs list
  await AsyncStorage.removeItem(SESSIONS_KEY);
};

