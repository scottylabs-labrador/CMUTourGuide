import React from 'react';
import { View, Text, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  title: string;
  imageSource: ImageSourcePropType | null;
  unlocked: boolean;
  scannable: boolean;
  onPress: () => void;
  width?: number;
  style?: object;
  // Stable id for FlatList recycling so expo-image can keep its decoded
  // bitmap cached across cell reuse.
  recyclingKey?: string;
  // Landmarks use distinct copy ("Landmark" badge, "Discover this landmark.")
  // since "Unlocked / Explore this building" reads oddly for a sculpture or
  // campus tradition.
  landmark?: boolean;
  // CMU college / campus area (e.g. "Computer Science", "Engineering").
  // Shown as the card badge in place of the old unlock-state tag.
  college?: string;
};

export default function BuildingCard({ title, imageSource, unlocked, scannable, onPress, width = 210, style, recyclingKey, landmark = false, college }: Props) {
  const badgeText = landmark
    ? 'Landmark'
    : college ?? (unlocked ? 'Unlocked' : 'Explore');

  return (
    <TouchableOpacity
      className="mt-3 rounded-[20px] bg-card overflow-hidden"
      style={[
        {
          width,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="w-full h-[130px] relative bg-border">
        {imageSource ? (
          <Image
            source={imageSource}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            recyclingKey={recyclingKey}
          />
        ) : (
          <View className="w-full h-full justify-center items-center bg-border">
            <Ionicons name="business-outline" size={32} color="#999" />
          </View>
        )}
        {!unlocked && scannable && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/50">
            <Ionicons name="lock-closed" size={18} color="#fff" />
            <Text className="font-serif mt-1 text-xs text-white">Scan to unlock</Text>
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          className="absolute top-0 left-0 right-0 h-10"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          className="absolute bottom-0 left-0 right-0 h-[60px]"
        />
        <View className="absolute top-[10px] left-[10px] px-[10px] py-1 rounded-full bg-white/85">
          <Text className="font-serif-bold text-[11px] text-cmu-red">{badgeText}</Text>
        </View>
      </View>
      <View className="px-3 py-[10px]">
        <Text className="font-serif-bold text-sm text-[#1F2933] mb-0.5 text-center">{title}</Text>
        <Text className="font-serif text-xs text-[#7A8593] text-center">
          {landmark
            ? 'Discover this landmark.'
            : scannable
              ? 'Scan for building information.'
              : 'Explore this building.'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
