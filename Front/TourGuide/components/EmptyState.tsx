import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export default function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name={icon} size={64} color="#ddd" />
      <Text className="font-serif-semi text-lg text-muted mt-4">{title}</Text>
      {subtitle && <Text className="font-serif text-sm text-[#bbb] mt-2">{subtitle}</Text>}
    </View>
  );
}
