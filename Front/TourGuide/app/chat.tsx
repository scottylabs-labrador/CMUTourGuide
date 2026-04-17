import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { Message } from '../types/chat';
import { useChatSession } from '../hooks/useChatSession';
import ScreenHeader from '../components/ScreenHeader';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS } from '../constants/layout';

export default function ChatScreen() {
  const { sessionId, imageUri, building_name } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');
  const router = useRouter();

  const { messages, isTyping, flatListRef, imageUriState, sendMessage } = useChatSession({
    sessionId: sessionId ? String(sessionId) : undefined,
    imageUri: imageUri ? String(imageUri) : undefined,
    buildingName: building_name ? String(building_name) : undefined,
  });

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View className={`my-1 px-4 ${item.isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] px-[10px] py-[10px] rounded-[20px] ${
          item.isUser ? 'bg-cmu-red rounded-br-[4px]' : 'bg-white rounded-bl-[4px]'
        }`}
        style={item.isUser ? undefined : SHADOWS.small}
      >
        {item.isUser ? (
          <Text className="font-serif text-[16px] text-white" style={{ lineHeight: 22 }}>
            {item.text}
          </Text>
        ) : (
          <Markdown
            style={{
              body: {
                fontFamily: FONTS.regular,
                fontSize: 16,
                lineHeight: 22,
                color: COLORS.textPrimary,
              },
              strong: {
                fontFamily: FONTS.bold,
                color: COLORS.textPrimary,
              },
            }}
          >
            {item.text}
          </Markdown>
        )}
        <Text
          className={`font-serif text-xs mt-1 ${
            item.isUser ? 'text-right' : 'text-muted'
          }`}
          style={item.isUser ? { color: 'rgba(255,255,255,0.7)' } : undefined}
        >
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderImageMessage = () => {
    if (!imageUriState) return null;

    return (
      <View className="my-1 px-4 items-end">
        <View className="max-w-[250px] rounded-[20px] bg-cmu-red rounded-br-[4px] p-0 overflow-hidden">
          <Image
            source={{ uri: imageUriState }}
            style={{ width: 180, height: 250 }}
            contentFit="contain"
            transition={200}
          />
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View className="my-1 px-4 items-start">
      <View className="max-w-[80%] px-[10px] py-[10px] rounded-[20px] bg-white rounded-bl-[4px]" style={SHADOWS.small}>
        <View className="flex-row items-center">
          <Text className="font-serif text-[#666] text-sm italic mr-2">AI is typing</Text>
          <View className="flex-row">
            <View className="w-[6px] h-[6px] rounded-[3px] bg-cmu-red mx-[2px]" />
            <View className="w-[6px] h-[6px] rounded-[3px] bg-cmu-red mx-[2px]" />
            <View className="w-[6px] h-[6px] rounded-[3px] bg-cmu-red mx-[2px]" />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <ScreenHeader
          title="CMU Tour Guide"
          onBack={() => router.back()}
          rightAction={{
            icon: 'add',
            onPress: () => router.dismissTo("/camera"),
          }}
        />

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16 }}
          ListHeaderComponent={renderImageMessage}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Input */}
        <View className="flex-row items-end px-4 py-3 bg-white border-t border-[#e0e0e0]">
          <TextInput
            className="flex-1 border border-[#e0e0e0] rounded-[20px] px-4 py-3 mr-3 font-serif text-[16px]"
            style={{ maxHeight: 100 }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the building..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className="w-11 h-11 rounded-[22px] justify-center items-center"
            style={{ backgroundColor: inputText.trim() === '' ? '#e0e0e0' : CMU_RED }}
            onPress={handleSend}
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
