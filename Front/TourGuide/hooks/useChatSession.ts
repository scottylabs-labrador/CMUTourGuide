import { useState, useRef, useEffect } from 'react';
import { FlatList } from 'react-native';
import { saveChatSession, getChatSession } from '../utils/chatStorage';
import { sendChatMessage } from '../services/chatService';
import { TimeoutError } from '../services/http';
import { Message, ChatSession } from '../types/chat';

type Params = {
  sessionId?: string;
  imageUri?: string;
  buildingName?: string;
  buildingId?: string;
};

export function useChatSession({ sessionId, imageUri, buildingName, buildingId }: Params) {
  const [sessionIdState, setSessionIdState] = useState<string>(
    sessionId ?? `chat_${Date.now()}`
  );
  const [imageUriState, setImageUriState] = useState<string | undefined>(imageUri);
  const [buildingIdState, setBuildingIdState] = useState<string | undefined>(buildingId);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi, Welcome to CMU! Im your personal AI campus Tour Guide. What would you like to know about ${buildingName}?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  // Sync guard: isTyping state lags within the same tick, so a ref blocks overlapping sends
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    const loadSession = async () => {
      const session = await getChatSession(sessionId);
      if (session && session.messages.length > 0) {
        setMessages(session.messages);
        setSessionIdState(session.id);
        if (session.imageUri) setImageUriState(session.imageUri);
        if (session.buildingId) setBuildingIdState(session.buildingId);
      }
    };
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const saveSession = async () => {
      // Greeting-only state is never saved: avoids empty chats and clobbering a session that's still loading
      if (!messages.some((m) => m.isUser)) return;
      const session: ChatSession = {
        id: sessionIdState,
        messages,
        createdAt: messages[0].timestamp.toISOString(),
        updatedAt: messages[messages.length - 1].timestamp.toISOString(),
        imageUri: imageUriState,
        buildingId: buildingIdState,
      };
      await saveChatSession(session);
    };
    saveSession();
  }, [messages, sessionIdState, imageUriState, buildingIdState]);

  const sendMessage = async (text: string) => {
    if (text.trim() === '' || pendingRef.current) return;
    pendingRef.current = true;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(updatedMessages, buildingIdState, sessionIdState);
      const chatMessage: Message = {
        id: Date.now().toString(),
        text: reply,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, chatMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: error instanceof TimeoutError
          ? 'Sorry, that took too long. Check your connection and try again.'
          : "Sorry, I couldn't get a response. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      pendingRef.current = false;
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    flatListRef,
    imageUriState,
    buildingIdState,
    sendMessage,
  };
}
