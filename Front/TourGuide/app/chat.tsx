import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Image } from 'expo-image';
import { saveChatSession, getChatSession } from '../utils/chatStorage';
import { Message, ChatSession } from '../types/chat';

export default function ChatScreen() {
  const { sessionId, imageUri, building_name } = useLocalSearchParams();
  const [sessionIdState, setSessionIdState] = useState<string>(
    sessionId ? String(sessionId) : `chat_${Date.now()}`
  );
  const [imageUriState, setImageUriState] = useState<string | undefined>(
    imageUri ? String(imageUri) : undefined
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi, Welcome to CMU! Im your personal AI campus Tour Guide. What would you like to know about " + building_name + "?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    // Load existing session if sessionId is provided
    const loadSession = async () => {
      if (sessionId) {
        const session = await getChatSession(String(sessionId));
        if (session && session.messages.length > 0) {
          setMessages(session.messages);
          setSessionIdState(session.id);
          if (session.imageUri) {
            setImageUriState(session.imageUri);
          }
        }
      }
    };
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Save chat session whenever messages change
    const saveSession = async () => {
      if (messages.length > 0) {
        const session: ChatSession = {
          id: sessionIdState,
          messages: messages,
          createdAt: messages[0].timestamp.toISOString(),
          updatedAt: messages[messages.length - 1].timestamp.toISOString(),
          imageUri: imageUriState,
        };
        await saveChatSession(session);
      }
    };
    saveSession();
  }, [messages, sessionIdState, imageUriState]);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const res = await fetch('https://cmutourguide-backend-production.up.railway.app/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updatedMessages,
      })
    });

    const data = await res.json();
    console.log(data)

    const chatMessage: Message = {
      id: Date.now().toString(),
      text: data.reply,
      isUser: false,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, chatMessage]);
    setIsTyping(false);

  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
      <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        {item.isUser ? (
          <Text style={[styles.messageText, styles.userText]}>
            {item.text}
          </Text>
        ) : (
          <Markdown 
            style={{
              body: {
                ...styles.messageText,
                ...styles.aiText,
              },
              strong: styles.boldText,
            }}
          >
            {item.text}
          </Markdown>
        )}
        <Text style={[styles.timestamp, item.isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderImageMessage = () => {
    if (!imageUriState) return null;
    
    return (
      <View style={[styles.messageContainer, styles.userMessage]}>
        <View style={[styles.messageBubble, styles.userBubble, styles.imageBubble]}>
          <Image
            source={{ uri: imageUriState }}
            style={styles.chatImage}
            contentFit="contain"
            transition={200}
          />
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>AI is typing</Text>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>CMU Tour Guide</Text>
            <Text style={styles.headerSubtitle}>AI Assistant</Text>
          </View>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => router.dismissTo("/camera")}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListHeaderComponent={renderImageMessage}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the building..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() === '' ? '#999' : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
<<<<<<< HEAD
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
=======
    fontFamily: 'SourceSerifPro_600SemiBold',
    color: 'white',
    fontSize: 18,
  },
  headerSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
>>>>>>> frontend-edit-made-by-krish
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  newChatButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#C41E3A',
    borderBottomRightRadius: 4,
  },
  imageBubble: {
    padding: 0,
    overflow: 'hidden',
    maxWidth: 250,
  },
  chatImage: {
    width: 180,
    height: 250,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
<<<<<<< HEAD
=======
    fontFamily: 'SourceSerifPro_400Regular',
>>>>>>> frontend-edit-made-by-krish
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  boldText: {
<<<<<<< HEAD
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
=======
    fontFamily: 'SourceSerifPro_700Bold',
    color: '#333',
  },
  timestamp: {
    fontFamily: 'SourceSerifPro_400Regular',
>>>>>>> frontend-edit-made-by-krish
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
<<<<<<< HEAD
=======
    fontFamily: 'SourceSerifPro_400Regular',
>>>>>>> frontend-edit-made-by-krish
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C41E3A',
    marginHorizontal: 2,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
<<<<<<< HEAD
=======
    fontFamily: 'SourceSerifPro_400Regular',
>>>>>>> frontend-edit-made-by-krish
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#C41E3A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});
