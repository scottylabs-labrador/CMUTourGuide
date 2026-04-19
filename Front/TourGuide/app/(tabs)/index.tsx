import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../../contexts/BuildingContext';
import SummaryModal from '../../components/SummaryModal';
import CampusMap from '../../components/CampusMap';
import { CMU_RED } from '../../constants/colors';
import { SHADOWS } from '../../constants/layout';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(470, Math.round(SCREEN_HEIGHT * 0.54));

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlockedScannableCount, totalScannableCount } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false);
  const [buildingId, setBuildingId] = React.useState('');

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const HEADER_SCROLL_RANGE = 200;
  const HERO_FADE_END = HEADER_SCROLL_RANGE * 0.55;
  const STICKY_FADE_START = HEADER_SCROLL_RANGE * 0.55;

  const [headerVisible, setHeaderVisible] = React.useState(false);
  React.useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setHeaderVisible(value > STICKY_FADE_START);
    });
    return () => scrollY.removeListener(id);
  }, []);

  const handlePastChats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/pastChats');
  };

  const handleBlog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/blog');
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  };

  // Hero fades out in the first ~55% of the scroll range...
  const heroLogoOpacity = scrollY.interpolate({
    inputRange: [0, HERO_FADE_END],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  // ...and slides up at a slight parallax for a natural collapse.
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });
  // Sticky header only appears after the hero has finished fading,
  // so they never overlap visually.
  const fixedHeaderOpacity = scrollY.interpolate({
    inputRange: [STICKY_FADE_START, HEADER_SCROLL_RANGE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <SafeAreaView className="flex-1 bg-transparent" edges={['left', 'right']}>
        <View className="absolute top-0 left-0 right-0 bg-cmu-red" style={{ height: insets.top }} />
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              paddingBottom: 12,
              opacity: fixedHeaderOpacity,
            },
          ]}
          pointerEvents={headerVisible ? 'box-none' : 'none'}
        >
          <View
            className="flex-row items-center justify-between bg-cmu-red px-5 pb-3"
            style={{ paddingTop: insets.top }}
          >
            <Text className="font-serif-semi text-lg text-white flex-1" numberOfLines={1}>
              Campus Explorer
            </Text>
            <TouchableOpacity onPress={() => router.push('/info')} activeOpacity={0.8} className="p-1 ml-2">
              <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 0, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <Animated.View
            style={{
              backgroundColor: CMU_RED,
              paddingBottom: 18,
              paddingHorizontal: 24,
              marginHorizontal: -24,
              marginBottom: 16,
              alignSelf: 'stretch',
              position: 'relative',
              opacity: heroLogoOpacity,
              transform: [{ translateY: heroTranslateY }],
              paddingTop: insets.top + 10,
            }}
          >
            <TouchableOpacity
              className="absolute right-4 p-1 z-[1]"
              style={{ top: insets.top + 10 }}
              onPress={() => router.push('/info')}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
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
          </Animated.View>

          {/* Primary actions row */}
          <View className="flex-row gap-3 mb-6">
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
              onPress={handlePastChats}
              activeOpacity={0.85}
            >
              <View
                className="w-11 h-11 rounded-[22px] items-center justify-center mb-2"
                style={{ backgroundColor: 'rgba(196,18,48,0.08)' }}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={CMU_RED} />
              </View>
              <Text className="font-serif-semi text-[13px] text-[#1F2933]">Chats</Text>
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

          {/* Embedded campus map — main map view for the user */}
          <View className="mb-6">
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
              className="rounded-[24px] overflow-hidden"
              style={[{ height: MAP_HEIGHT }, SHADOWS.card]}
            >
              <CampusMap
                onBuildingPress={(id) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBuildingId(id);
                  setShowSummaryPopup(true);
                }}
                onExpand={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/map');
                }}
              />
            </View>
          </View>

        </Animated.ScrollView>

        <SummaryModal
          visible={showSummaryPopup}
          onClose={() => setShowSummaryPopup(false)}
          building_id={buildingId}
          isNewUnlock={false}
        />
      </SafeAreaView>
    </View>
  );
}
