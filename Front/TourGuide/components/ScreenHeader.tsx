import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type RightAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

type Props = {
  title: string;
  onBack: () => void;
  rightAction?: RightAction;
};

export default function ScreenHeader({ title, onBack, rightAction }: Props) {
  return (
    <View
      className="flex-row items-center px-4 py-3 bg-cmu-red"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <TouchableOpacity className="p-2" onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View className="flex-1 items-center">
        <Text className="font-serif-semi text-white text-lg">{title}</Text>
      </View>
      {rightAction ? (
        <TouchableOpacity
          className="p-2"
          onPress={rightAction.onPress}
          disabled={rightAction.disabled}
        >
          <Ionicons
            name={rightAction.icon}
            size={24}
            color={rightAction.color ?? (rightAction.disabled ? 'rgba(255,255,255,0.3)' : '#FFFFFF')}
          />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
