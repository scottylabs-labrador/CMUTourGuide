import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { usePostHog } from 'posthog-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteCompletionModalProps {
  visible: boolean;
  routeName: string;
  stopCount: number;
  onExploreNewRoute: () => void;
  onDismiss: () => void;
}

/**
 * Celebratory popup shown when every stop in the active tour route has been
 * unlocked. Rendered globally from app/_layout.tsx so it can appear no matter
 * which screen the user is on when the final scan happens.
 */
export default function RouteCompletionModal({
  visible,
  routeName,
  stopCount,
  onExploreNewRoute,
  onDismiss,
}: RouteCompletionModalProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
      posthog.capture('route_completed', {
        route_name: routeName,
        stop_count: stopCount,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/70 justify-center items-center">
        <Pressable
          onPress={onDismiss}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          className="bg-white rounded-[20px] p-6 items-center"
          style={{
            width: SCREEN_WIDTH * 0.9,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            className="absolute top-3 right-3 p-1"
            onPress={onDismiss}
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={26} color="#666" />
          </TouchableOpacity>

          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: '#FFF9E6', borderWidth: 2, borderColor: '#FFD700' }}
          >
            <Ionicons name="trophy" size={32} color="#E6A817" />
          </View>

          <Text className="font-serif-bold text-[22px] text-cmu-red mb-1 text-center">
            Route Complete!
          </Text>
          <Text
            className="font-serif-semi text-[15px] text-center mb-2"
            style={{ color: COLORS.textPrimary }}
            numberOfLines={2}
          >
            {routeName}
          </Text>
          <Text
            className="font-serif text-[13px] text-center mb-6"
            style={{ color: COLORS.textSecondary }}
          >
            You unlocked all {stopCount} stops on this route. Nice work!
          </Text>

          <TouchableOpacity
            className="bg-cmu-red w-full py-[14px] rounded-[25px] items-center"
            activeOpacity={0.85}
            onPress={onExploreNewRoute}
          >
            <Text className="font-serif-semi text-white text-base">
              Explore new route
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
