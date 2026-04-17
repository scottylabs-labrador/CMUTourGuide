import React from 'react';
import { View, Text } from 'react-native';

type Props = {
  current: number;
  total: number;
  label?: string;
  hint?: string;
};

export default function ProgressBar({ current, total, label = 'Discovery Progress', hint }: Props) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View
      className="bg-card rounded-[26px] p-5 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="mb-[10px]">
        <View>
          <Text className="font-serif-bold text-lg text-left text-[#1F2933]">{label}</Text>
          <Text className="font-serif-bold text-lg text-cmu-red mt-0.5">{current} / {total}</Text>
          {hint && <Text className="font-serif text-[13px] text-[#7A8593] mt-0.5">{hint}</Text>}
        </View>
      </View>
      <View className="h-2 bg-border rounded-[4px] overflow-hidden mt-2 mb-2">
        <View
          className="h-full bg-cmu-red rounded-[4px]"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}
