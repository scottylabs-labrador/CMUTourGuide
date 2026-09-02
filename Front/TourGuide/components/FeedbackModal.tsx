import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CMU_RED, COLORS } from '../constants/colors';
import { ENDPOINTS } from '../constants/api';
import { fetchWithTimeout } from '../services/http';
import { usePostHog } from 'posthog-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const FEEDBACK_TIMEOUT_MS = 15_000;

type Category = 'bug' | 'feedback' | 'other';

const CATEGORIES: { id: Category; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'bug', label: 'Bug', icon: 'bug-outline' },
  { id: 'feedback', label: 'Feedback', icon: 'chatbubble-ellipses-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<Category>('feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const posthog = usePostHog();

  const reset = () => {
    setCategory('feedback');
    setMessage('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Empty message', 'Please describe your feedback before sending.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Backend relays to Discord so the webhook URL never ships in the app bundle
      const res = await fetchWithTimeout(ENDPOINTS.feedback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: trimmed, platform: `${Platform.OS} ${Platform.Version}` }),
      }, FEEDBACK_TIMEOUT_MS);
      if (!res.ok) {
        throw new Error(`Feedback API responded ${res.status}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      posthog.capture('feedback_submitted', {
        category,
        message_length: trimmed.length,
        platform: Platform.OS,
      });
      reset();
      onClose();
      Alert.alert('Thanks!', 'Your feedback has been sent.');
    } catch (err) {
      console.warn('Failed to send feedback:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Couldn\u2019t send feedback',
        'Please check your connection and try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 bg-black/70 justify-center items-center">
          <Pressable
            onPress={handleClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            className="bg-white rounded-[20px] p-5"
            style={{
              width: SCREEN_WIDTH * 0.9,
              maxHeight: SCREEN_HEIGHT * 0.8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="chatbubbles-outline" size={22} color={CMU_RED} />
                <Text className="font-serif-bold text-[20px] text-cmu-red">Send Feedback</Text>
              </View>
              <TouchableOpacity className="p-1" onPress={handleClose} disabled={submitting}>
                <Ionicons name="close" size={26} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="font-serif text-[14px] text-[#666] mb-4 leading-5">
                CMU Campus Explorer is actively in development! We always seek feedback to improve the app.
              </Text>

              {/* Category picker */}
              <Text className="font-serif-semi text-[13px] text-[#1F2933] mb-2 uppercase tracking-wider">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-5">
                {CATEGORIES.map((c) => {
                  const selected = c.id === category;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(c.id);
                      }}
                      activeOpacity={0.85}
                      className="flex-row items-center px-3 py-2 rounded-full border"
                      style={{
                        backgroundColor: selected ? CMU_RED : '#FFF',
                        borderColor: selected ? CMU_RED : '#E0E0E0',
                      }}
                    >
                      <Ionicons
                        name={c.icon}
                        size={14}
                        color={selected ? '#FFF' : COLORS.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        className="font-serif-semi text-[12px]"
                        style={{ color: selected ? '#FFF' : '#1F2933' }}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message */}
              <Text className="font-serif-semi text-[13px] text-[#1F2933] mb-2 uppercase tracking-wider">
                Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Describe what happened, what you'd like to see, or any other thoughts…"
                placeholderTextColor="#9AA4B2"
                multiline
                textAlignVertical="top"
                maxLength={2000}
                editable={!submitting}
                className="font-serif text-[15px] text-[#1F2933] rounded-[12px] border p-3 mb-1"
                style={{
                  borderColor: '#E0E0E0',
                  minHeight: 130,
                  maxHeight: 220,
                }}
              />
              <Text className="font-serif text-[11px] text-[#9AA4B2] text-right mb-4">
                {message.length} / 2000
              </Text>
            </ScrollView>

            {/* Actions */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleClose}
                disabled={submitting}
                activeOpacity={0.8}
                className="flex-1 rounded-[14px] py-[14px] items-center bg-card"
              >
                <Text className="font-serif-semi text-[15px] text-[#1F2933]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
                className="flex-1 rounded-[14px] py-[14px] items-center bg-cmu-red flex-row justify-center"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                <Ionicons name="send" size={15} color="#FFF" style={{ marginRight: 6 }} />
                <Text className="font-serif-semi text-[15px] text-white">
                  {submitting ? 'Sending…' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
