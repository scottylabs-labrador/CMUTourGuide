import React from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import { getAllBuildingIds, getBuilding } from '../services/buildingService';
import SummaryModal from '../components/SummaryModal';
import BuildingCard from '../components/BuildingCard';
import ProgressBar from '../components/ProgressBar';
import { CMU_RED } from '../constants/colors';
import { SHADOWS } from '../constants/layout';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isUnlocked,
    isScannable,
    unlockedScannableCount,
    totalScannableCount,
  } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false)
  const [buildingId, setBuildingId] = React.useState("")
  const buildingKeys = getAllBuildingIds();

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = React.useState(false);
  React.useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setHeaderVisible(value > 100);
    });
    return () => scrollY.removeListener(id);
  }, []);
  const scrollXBuildings = React.useRef(new Animated.Value(0)).current;
  const BUILDING_CARD_WIDTH = 210;
  const BUILDING_CARD_SPACING = 14;
  const BUILDING_SNAP_INTERVAL = BUILDING_CARD_WIDTH + BUILDING_CARD_SPACING;

  const handlePastChats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/pastChats');
  };

  const handleMapView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/map');
  };

  const handleBlog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/blog');
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  };

  const handleBuildingPress = (buildingId: string) => {
    if (isUnlocked(buildingId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBuildingId(buildingId);
      setShowSummaryPopup(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Building not unlocked", "Find the building to unlock it!");
    }
  };

  const HEADER_SCROLL_RANGE = 260;
  const fixedHeaderOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const heroLogoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const heroLogoScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <SafeAreaView className="flex-1 bg-transparent" edges={['left', 'right', 'bottom']}>
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
              Carnegie Mellon University
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
              paddingBottom: 32,
              paddingHorizontal: 24,
              marginHorizontal: -24,
              marginBottom: 16,
              alignSelf: 'stretch',
              position: 'relative',
              opacity: heroLogoOpacity,
              transform: [{ scale: heroLogoScale }],
              paddingTop: insets.top + 12,
            }}
          >
            <TouchableOpacity className="absolute top-3 right-4 p-1 z-[1]" onPress={() => router.push('/info')} activeOpacity={0.8}>
              <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="font-serif-semi text-[36px] text-white" style={{ letterSpacing: -0.5, lineHeight: 40 }}>
              Carnegie
            </Text>
            <Text className="font-serif-semi text-[36px] text-white -mt-1" style={{ letterSpacing: -0.5, lineHeight: 40 }}>
              Mellon
            </Text>
            <Text className="font-serif-semi text-[36px] text-white -mt-1" style={{ letterSpacing: -0.5, lineHeight: 40 }}>
              University
            </Text>
          </Animated.View>

          <View className="mb-[10px]">
            <Text className="font-serif text-[16px] text-[#7A8593] mb-1">Ready to Explore</Text>
            <Text className="font-serif-bold text-[28px] text-[#1F2933] mb-2">Carnegie Mellon!</Text>
          </View>

          {/* Scan CTA card */}
          <View
            className="flex-row items-center justify-between rounded-[28px] py-7 px-6 bg-card overflow-hidden mb-6"
            style={SHADOWS.card}
          >
            <View className="flex-row items-center flex-1 mr-4">
              <TouchableOpacity
                className="w-[88px] h-[88px] rounded-[44px] items-center justify-center mr-[18px]"
                style={{ backgroundColor: 'rgba(196,18,48,0.08)' }}
                onPress={handleScan}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={48} color={CMU_RED} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="font-serif-bold text-[17px] text-[#1F2933] mb-1" numberOfLines={1}>
                  Scan a CMU marker
                </Text>
                <Text className="font-serif text-[15px] text-[#7A8593]">
                  Unlock building stories, trivia, and map pins.
                </Text>
              </View>
            </View>
          </View>

          {/* Discovery Progress */}
          <View className="mb-6">
            <ProgressBar
              current={unlockedScannableCount}
              total={totalScannableCount}
              hint="Unlock more buildings to reveal campus stories."
            />
          </View>

          {/* Quick actions */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 rounded-[26px] bg-card overflow-hidden" style={SHADOWS.card}>
              <TouchableOpacity
                className="py-[18px] px-[18px]"
                onPress={handlePastChats}
                activeOpacity={0.8}
              >
                <View
                  className="w-9 h-9 rounded-[18px] items-center justify-center mb-[10px]"
                  style={{ backgroundColor: 'rgba(196,18,48,0.07)' }}
                >
                  <Ionicons name="chatbubbles-outline" size={22} color={CMU_RED} />
                </View>
                <Text className="font-serif-bold text-[15px] text-[#1F2933] mb-[3px]">Chats</Text>
                <Text className="font-serif text-[13px] text-[#7A8593]">
                  Ask questions & get hints.
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1 rounded-[26px] bg-card overflow-hidden" style={SHADOWS.card}>
              <TouchableOpacity
                className="py-[18px] px-[18px]"
                onPress={handleMapView}
                activeOpacity={0.8}
              >
                <View
                  className="w-9 h-9 rounded-[18px] items-center justify-center mb-[10px]"
                  style={{ backgroundColor: 'rgba(196,18,48,0.07)' }}
                >
                  <Ionicons name="map-outline" size={22} color={CMU_RED} />
                </View>
                <Text className="font-serif-bold text-[15px] text-[#1F2933] mb-[3px]">Map</Text>
                <Text className="font-serif text-[13px] text-[#7A8593]">
                  Find nearby landmarks.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Blog card */}
          <View className="rounded-[26px] bg-card overflow-hidden mb-7" style={SHADOWS.card}>
            <TouchableOpacity
              className="flex-row items-center py-[18px] px-[18px]"
              onPress={handleBlog}
              activeOpacity={0.8}
            >
              <View
                className="w-9 h-9 rounded-[18px] items-center justify-center mb-[10px]"
                style={{ backgroundColor: 'rgba(196,18,48,0.07)' }}
              >
                <Ionicons name="newspaper-outline" size={22} color={CMU_RED} />
              </View>
              <View className="flex-1 ml-[14px]">
                <Text className="font-serif-bold text-[15px] text-[#1F2933] mb-[3px]">Blog</Text>
                <Text className="font-serif text-[13px] text-[#7A8593]">
                  Stories, history, and campus trivia.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Buildings carousel */}
          <View className="mt-0 -mx-6">
            <View className="flex-row justify-between items-center mb-3 px-6">
              <Text className="font-serif-bold text-[20px] text-[#1F2933]">Buildings</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/allBuildings');
                }}
              >
                <Text className="font-serif text-[13px] text-cmu-red">See all</Text>
              </TouchableOpacity>
            </View>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              snapToInterval={BUILDING_SNAP_INTERVAL}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollXBuildings } } }],
                { useNativeDriver: true }
              )}
            >
              {buildingKeys.map((buildingId, index) => {
                const building = getBuilding(buildingId);
                if (!building) return null;
                const unlocked = isUnlocked(buildingId);
                const scannable = isScannable(buildingId);

                const scale = scrollXBuildings.interpolate({
                  inputRange: [
                    (index - 1) * BUILDING_SNAP_INTERVAL,
                    index * BUILDING_SNAP_INTERVAL,
                    (index + 1) * BUILDING_SNAP_INTERVAL,
                  ],
                  outputRange: [0.9, 1.1, 0.9],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={buildingId}
                    style={{ transform: [{ scale }] }}
                  >
                    <BuildingCard
                      title={building.title}
                      imageUrl={building.image_url}
                      unlocked={unlocked}
                      scannable={scannable}
                      onPress={() => handleBuildingPress(buildingId)}
                      style={{ marginRight: 14 }}
                    />
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
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
