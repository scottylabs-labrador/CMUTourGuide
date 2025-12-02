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
        <Ionicons name="chatbubble" size={24} color="#C41E3A" />
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
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
      <Text style={styles.emptyText}>No past chats</Text>
      <Text style={styles.emptySubtext}>Start a conversation to see it here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Past Chats</Text>
        </View>
        <TouchableOpacity
          style={styles.trashButton}
          onPress={handleClearAll}
          disabled={sessions.length === 0}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={sessions.length === 0 ? 'rgba(255,255,255,0.3)' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C41E3A" />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#C41E3A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  trashButton: {
    padding: 8,
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
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  messageCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});

