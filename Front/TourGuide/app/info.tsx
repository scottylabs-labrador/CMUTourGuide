import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../contexts/BuildingContext';
import { CMU_RED } from '../constants/colors';
import FeedbackModal from '../components/FeedbackModal';

const PRIVACY_POLICY_URL = 'https://github.com/scottylabs-labrador/CMUTourGuide/blob/main/docs/privacy-policy.md';

export default function InfoScreen() {
  const router = useRouter();
  const { clearStorage } = useBuildings();
  const [feedbackVisible, setFeedbackVisible] = useState(false);

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
          <Text className="font-serif text-[16px] text-[#666]">Your Intelligent Campus Guide</Text>
        </View>

        {/* What is it */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="information-circle" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">What is it?</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            CMU Campus Explorer is your personal pocket tour guide for Carnegie Mellon University. It uses computer vision and AI to share detailed information about buildings and landmarks across campus.
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
            <Text className="font-serif-semi text-[20px] text-cmu-red">How it works</Text>
          </View>
          <View className="gap-4">
            <View className="flex-row items-start gap-3">
              <Ionicons name="map" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Select a route on the map to explore the campus</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="camera" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Scan buildings and landmarks with your camera to get instant insights and history</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="chatbubbles" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Chat with our AI to ask follow-up questions and learn more about our campus</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="book" size={20} color={CMU_RED} />
              <Text className="font-serif flex-1 text-[16px] text-[#1F2933] leading-6">Read our student-written blog posts to learn more about student-life on campus</Text>
            </View>
          </View>
        </View>

        {/* About Us */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="heart" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">About Us</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            CMU Campus Explorer was built by Noah Choi and Kaveh Fayyazi, members of ScottyLabs, a student-run club at Carnegie Mellon University that builds practical software for our school community. Explore more projects at{' '}
            <Text className="font-serif-semi text-cmu-red" onPress={() => Linking.openURL('https://scottylabs.org')}>scottylabs.org</Text>.
          </Text>
        </View>

        {/* Contact */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="mail" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">Contact</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            Have feedback or found a bug?{' '}
            <Text className="font-serif-semi text-cmu-red" onPress={() => setFeedbackVisible(true)}>
              Press here
            </Text>{' '}
            to report it, or reach out at{' '}
            <Text
              className="font-serif-semi text-cmu-red"
              onPress={() => Linking.openURL('mailto:noahchoi@andrew.cmu.edu')}
            >
              noahchoi@andrew.cmu.edu
            </Text>
            .
          </Text>
        </View>

        {/* Privacy */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 gap-2">
            <Ionicons name="shield-checkmark" size={24} color={CMU_RED} />
            <Text className="font-serif-semi text-[20px] text-cmu-red">Privacy</Text>
          </View>
          <Text className="font-serif text-[16px] text-[#1F2933] leading-6">
            Scanned photos and chat messages are sent to our servers to identify buildings and answer questions. Read the full{' '}
            <Text className="font-serif-semi text-cmu-red" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              privacy policy
            </Text>
            .
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
        <View className="items-center mt-2 pt-6 border-t border-border">
          <Text className="font-serif text-sm text-muted">Made for Carnegie Mellon University</Text>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />
    </SafeAreaView>
  );
}
