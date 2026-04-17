import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllChatSessions, clearAllChatSessions } from '../utils/chatStorage';
import { ChatSession } from '../types/chat';
import * as Haptics from 'expo-haptics';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS } from '../constants/layout';

export default function PastChatsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

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

  const getChatTitle = (session: ChatSession): string => {
    if (session.messages.length === 0) return 'Empty Chat';
    const firstUserMessage = session.messages.find(msg => msg.isUser);
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.chatIcon}>
        <Ionicons name="chatbubble" size={24} color={CMU_RED} />
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {getChatTitle(item)}
          </Text>
          <Text style={styles.chatTime}>{formatDate(item.updatedAt)}</Text>
        </View>
        <Text style={styles.chatPreview} numberOfLines={2}>
          {getChatPreview(item)}
        </Text>
        <Text style={styles.messageCount}>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Past Chats"
        onBack={() => router.back()}
        rightAction={{
          icon: 'trash-outline',
          onPress: handleClearAll,
          disabled: sessions.length === 0,
        }}
      />

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CMU_RED} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={sessions.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chatPreview: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  messageCount: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
});

