import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../../contexts/BuildingContext';
import SummaryModal from '../../components/SummaryModal';
import CampusMap from '../../components/CampusMap';
import RoutePickerModal from '../../components/RoutePickerModal';
import FeedbackModal from '../../components/FeedbackModal';
import { getAllRoutes } from '../../services/routeService';
import { CMU_RED } from '../../constants/colors';
import { SHADOWS } from '../../constants/layout';
import { usePostHog } from 'posthog-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const {
    unlockedScannableCount,
    totalScannableCount,
    activeRouteId,
    setActiveRouteId,
  } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false);
  const [buildingId, setBuildingId] = React.useState('');
  const [showRoutePicker, setShowRoutePicker] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);

  const handleFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFeedback(true);
  };

  const handleRoutes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRoutePicker(true);
  };

  const handleBlog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/blog');
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  };

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <SafeAreaView className="flex-1 bg-transparent" edges={['left', 'right']}>
        <View
          style={{
            backgroundColor: CMU_RED,
            paddingTop: insets.top + 10,
            paddingBottom: 18,
            paddingHorizontal: 24,
            position: 'relative',
          }}
        >
          <View
            className="absolute right-4 z-[1] flex-row items-center"
            style={{ top: insets.top + 10 }}
          >
            <TouchableOpacity
              className="p-1 mr-2"
              onPress={handleFeedback}
              activeOpacity={0.8}
              accessibilityLabel="Send feedback"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-1"
              onPress={() => router.push('/info')}
              activeOpacity={0.8}
              accessibilityLabel="About this app"
            >
              <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text
            className="font-sans-semi text-[11px] text-white/80 mb-1"
            style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}
          >
            Carnegie Mellon University
          </Text>
          <Text
            className="font-serif-semi text-[28px] text-white"
            style={{ letterSpacing: -0.4, lineHeight: 32 }}
          >
            Campus Explorer
          </Text>
        </View>

        <View className="flex-1 px-6 pt-4">
          {/* Primary actions row */}
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              className="flex-1 rounded-[20px] items-center py-4 bg-cmu-red"
              style={SHADOWS.card}
              onPress={handleScan}
              activeOpacity={0.85}
            >
              <View className="w-11 h-11 rounded-[22px] items-center justify-center mb-2 bg-white/15">
                <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
              </View>
              <Text className="font-serif-semi text-[13px] text-white">Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 rounded-[20px] items-center py-4 bg-card"
              style={SHADOWS.card}
              onPress={handleRoutes}
              activeOpacity={0.85}
            >
              <View
                className="w-11 h-11 rounded-[22px] items-center justify-center mb-2"
                style={{ backgroundColor: 'rgba(196,18,48,0.08)' }}
              >
                <Ionicons name="map-outline" size={22} color={CMU_RED} />
              </View>
              <Text className="font-serif-semi text-[13px] text-[#1F2933]">Routes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 rounded-[20px] items-center py-4 bg-card"
              style={SHADOWS.card}
              onPress={handleBlog}
              activeOpacity={0.85}
            >
              <View
                className="w-11 h-11 rounded-[22px] items-center justify-center mb-2"
                style={{ backgroundColor: 'rgba(196,18,48,0.08)' }}
              >
                <Ionicons name="newspaper-outline" size={22} color={CMU_RED} />
              </View>
              <Text className="font-serif-semi text-[13px] text-[#1F2933]">Blog</Text>
            </TouchableOpacity>
          </View>

          {/* Embedded campus map — fills remaining space */}
          <View className="flex-1 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-serif-bold text-[20px] text-[#1F2933]">CMU Map</Text>
              <View className="flex-row items-center px-2 py-[3px] rounded-full bg-card">
                <Ionicons name="lock-open-outline" size={12} color={CMU_RED} />
                <Text className="font-serif-bold text-[12px] text-cmu-red ml-1">
                  {unlockedScannableCount} / {totalScannableCount}
                </Text>
              </View>
            </View>
            <View
              className="flex-1 rounded-[24px] overflow-hidden"
              style={SHADOWS.card}
            >
              <CampusMap
                activeRouteId={activeRouteId}
                onBuildingPress={(id) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBuildingId(id);
                  setShowSummaryPopup(true);
                }}
                onExpand={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  posthog.capture('map_expanded');
                  router.push('/map');
                }}
              />
            </View>
          </View>
        </View>

        <SummaryModal
          visible={showSummaryPopup}
          onClose={() => setShowSummaryPopup(false)}
          building_id={buildingId}
          isNewUnlock={false}
        />

        <RoutePickerModal
          visible={showRoutePicker}
          onClose={() => setShowRoutePicker(false)}
          routes={getAllRoutes()}
          activeRouteId={activeRouteId}
          onSelect={setActiveRouteId}
        />

        <FeedbackModal
          visible={showFeedback}
          onClose={() => setShowFeedback(false)}
        />
      </SafeAreaView>
    </View>
  );
}
