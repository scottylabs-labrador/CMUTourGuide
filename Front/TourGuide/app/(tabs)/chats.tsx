import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllChatSessions, clearAllChatSessions } from '../../utils/chatStorage';
import { ChatSession } from '../../types/chat';
import * as Haptics from 'expo-haptics';
import EmptyState from '../../components/EmptyState';
import { CMU_RED, COLORS } from '../../constants/colors';

export default function ChatsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const allSessions = await getAllChatSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Refresh when the tab is focused so new chats show up immediately.
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const getChatTitle = (session: ChatSession): string => {
    if (session.messages.length === 0) return 'Empty Chat';
    const firstUserMessage = session.messages.find((msg) => msg.isUser);
    if (firstUserMessage) {
      return firstUserMessage.text.length > 50
        ? firstUserMessage.text.substring(0, 50) + '...'
        : firstUserMessage.text;
    }
    const firstMessage = session.messages[0];
    return firstMessage.text.length > 50
      ? firstMessage.text.substring(0, 50) + '...'
      : firstMessage.text;
  };

  const getChatPreview = (session: ChatSession): string => {
    if (session.messages.length === 0) return 'No messages';
    const lastMessage = session.messages[session.messages.length - 1];
    return lastMessage.text.length > 80
      ? lastMessage.text.substring(0, 80) + '...'
      : lastMessage.text;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleChatPress = (sessionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/chat', params: { sessionId } });
  };

  const handleClearAll = () => {
    if (sessions.length === 0) return;

    Alert.alert(
      'Clear All Chats',
      'Are you sure you want to delete all chat history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllChatSessions();
            setSessions([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const renderChatItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white mx-4 my-[6px] p-4 rounded-[12px]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
      onPress={() => handleChatPress(item.id)}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full bg-[#F8F9FA] justify-center items-center mr-3">
        <Ionicons name="chatbubble" size={24} color={CMU_RED} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-serif-semi text-[16px] text-[#1F2933] flex-1 mr-2" numberOfLines={1}>
            {getChatTitle(item)}
          </Text>
          <Text className="font-serif text-xs text-muted">{formatDate(item.updatedAt)}</Text>
        </View>
        <Text className="font-serif text-sm text-[#666] mb-1 leading-5" numberOfLines={2}>
          {getChatPreview(item)}
        </Text>
        <Text className="font-serif text-xs text-muted mt-1">
          {item.messages.length} {item.messages.length === 1 ? 'message' : 'messages'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="chatbubbles-outline"
      title="No past chats"
      subtitle="Start a conversation to see it here"
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-border">
        <Text className="font-serif-bold text-[20px] text-cmu-red">Chats</Text>
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.7}
          disabled={sessions.length === 0}
          className="p-1"
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={sessions.length === 0 ? COLORS.textMuted : CMU_RED}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={CMU_RED} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            sessions.length === 0 ? { flexGrow: 1 } : { paddingVertical: 8 }
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
