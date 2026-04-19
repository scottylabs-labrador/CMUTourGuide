import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../contexts/BuildingContext';
import { CMU_RED } from '../constants/colors';

export default function InfoScreen() {
  const router = useRouter();
  const { clearStorage } = useBuildings();

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Progress',
      'Are you sure you want to clear all unlocked buildings? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearStorage();
              Alert.alert('Success', 'All progress has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear storage. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity
          className="p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={CMU_RED} />
        </TouchableOpacity>
        <Text className="font-serif-semi text-[20px] text-cmu-red">About</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Title */}
        <View className="items-center mb-10">
          <Text className="font-serif-bold text-[32px] text-cmu-red mb-2 tracking-tight">{`CMU Campus Explorer`}</Text>
          <Text className="font-serif text-[16px] text-[#666]">Your Intelligent Campus Companion</Text>
        </View>

        {/* What is it */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="information-circle" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">What is it?</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            CMU Tour Guide is an AI-powered mobile application that uses computer vision and artificial intelligence to provide instant, detailed information about buildings, monuments, and landmarks across Carnegie Mellon University's campus.
          </Text>
        </View>

        {/* Who is it for */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="people" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">Who is it for?</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            Perfect for prospective students, new visitors, current students exploring campus, alumni returning to campus, and anyone curious about CMU and life on campus.
          </Text>
        </View>

        {/* What it does */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="sparkles" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">What it does</Text>
          </View>
          <View className="gap-4">
            <View className="flex-row items-start gap-3">
              <Ionicons name="camera" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Scan buildings and landmarks with your camera</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="bulb" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Get instant insights and history</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="chatbubbles" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Chat with our AI companion</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="map" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Explore campus with interactive maps</Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="settings" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">How it works</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            Simply point your camera at any building or landmark on campus. Our advanced computer vision technology identifies the building, and our AI system provides you with fascinating stories, historical context, and insider information about that place.
          </Text>
        </View>

        {/* Clear Storage Section */}
        <View className="mb-8">
          <TouchableOpacity
            className="flex-row items-center justify-center bg-cmu-red rounded-[12px] py-4 px-6 gap-2"
            onPress={handleClearStorage}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text className="font-serif-semi text-[16px] text-white">Clear All Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center mt-6 pt-6 border-t border-border">
          <Text className="font-serif text-sm text-muted">Made for Carnegie Mellon University</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
