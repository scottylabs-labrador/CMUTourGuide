import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import { getAllBuildingIds, getBuilding } from '../services/buildingService';
import SummaryModal from '../components/SummaryModal';
import BuildingCard from '../components/BuildingCard';
import ProgressBar from '../components/ProgressBar';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
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
    <View style={styles.gradientBackground}>
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={[styles.topRedBar, { height: insets.top }]} />
        <Animated.View style={[styles.fixedHeader, { opacity: fixedHeaderOpacity, top: 0 }]} pointerEvents={headerVisible ? 'box-none' : 'none'}>
          <View style={[styles.fixedHeaderRedBar, { paddingTop: insets.top }]}>
            <Text style={styles.fixedHeaderLogo} numberOfLines={1}>Carnegie Mellon University</Text>
            <TouchableOpacity onPress={() => router.push('/info')} activeOpacity={0.8} style={styles.fixedHeaderInfoBtn}>
              <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <Animated.View style={[styles.heroLogoBlock, { opacity: heroLogoOpacity, transform: [{ scale: heroLogoScale }], paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.push('/info')} activeOpacity={0.8} style={styles.heroLogoInfoBtn}>
              <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroLogoLine1}>Carnegie</Text>
            <Text style={styles.heroLogoLine2}>Mellon</Text>
            <Text style={styles.heroLogoLine3}>University</Text>
          </Animated.View>

          <View style={styles.heroSection}>
            <Text style={styles.heroSubtitle}>Ready to Explore</Text>
            <Text style={styles.heroTitle}>Carnegie Mellon!</Text>
          </View>

          {/* Scan CTA card - camera icon is the button */}
          <View style={styles.scanCard}>
            <View style={styles.scanLeft}>
              <TouchableOpacity
                style={styles.scanIconCircle}
                onPress={handleScan}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={48} color={CMU_RED} />
              </TouchableOpacity>
              <View style={styles.scanTextContainer}>
                <Text style={styles.scanTitle} numberOfLines={1}>Scan a CMU marker</Text>
                <Text style={styles.scanSubtitle}>
                  Unlock building stories, trivia, and map pins.
                </Text>
              </View>
            </View>
          </View>

          {/* Discovery Progress */}
          <View style={styles.progressWrapper}>
            <ProgressBar
              current={unlockedScannableCount}
              total={totalScannableCount}
              hint="Unlock more buildings to reveal campus stories."
            />
          </View>

          {/* Quick actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actionCard}>
              <TouchableOpacity
                style={styles.actionInner}
                onPress={handlePastChats}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name="chatbubbles-outline" size={22} color={CMU_RED} />
                </View>
                <Text style={styles.actionTitle}>Chats</Text>
                <Text style={styles.actionSubtitle}>
                  Ask questions & get hints.
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionCard}>
              <TouchableOpacity
                style={styles.actionInner}
                onPress={handleMapView}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name="map-outline" size={22} color={CMU_RED} />
                </View>
                <Text style={styles.actionTitle}>Map</Text>
                <Text style={styles.actionSubtitle}>
                  Find nearby landmarks.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Blog card */}
          <View style={styles.blogCard}>
            <TouchableOpacity
              style={styles.blogInner}
              onPress={handleBlog}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="newspaper-outline" size={22} color={CMU_RED} />
              </View>
              <View style={styles.blogTextContainer}>
                <Text style={styles.actionTitle}>Blog</Text>
                <Text style={styles.actionSubtitle}>
                  Stories, history, and campus trivia.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Buildings carousel */}
          <View style={styles.buildingsSection}>
            <View style={styles.buildingsHeaderRow}>
              <Text style={styles.sectionTitle}>Buildings</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/allBuildings');
                }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.buildingsCarousel}
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

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  topRedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: CMU_RED,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 12,
  },
  fixedHeaderRedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CMU_RED,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderRadius: 0,
  },
  fixedHeaderLogo: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
  },
  fixedHeaderInfoBtn: {
    padding: 4,
    marginLeft: 8,
  },
  heroLogoBlock: {
    backgroundColor: CMU_RED,
    paddingBottom: 32,
    paddingHorizontal: 24,
    marginHorizontal: -24,
    marginBottom: 16,
    alignSelf: 'stretch',
    position: 'relative',
  },
  heroLogoInfoBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  heroLogoLine1: {
    fontFamily: FONTS.semiBold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroLogoLine2: {
    fontFamily: FONTS.semiBold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginTop: -4,
  },
  heroLogoLine3: {
    fontFamily: FONTS.semiBold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginTop: -4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  appTitle: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: CMU_RED,
    letterSpacing: -0.5,
  },
  infoBlur: {
    borderRadius: 999,
    padding: 6,
    overflow: 'hidden',
  },
  heroSection: {
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
    overflow: 'hidden',
    marginBottom: 24,
  },
  scanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  scanIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196,18,48,0.08)',
    marginRight: 18,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  scanSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  blogCard: {
    borderRadius: 26,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
    marginBottom: 28,
  },
  blogInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  blogTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  actionCard: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  actionInner: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196,18,48,0.07)',
    marginBottom: 10,
  },
  actionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  actionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    marginTop: 8,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapPlaceholderText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  progressWrapper: {
    marginBottom: 24,
  },
  buildingsSection: {
    marginTop: 0,
    marginHorizontal: -24,
  },
  buildingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: CMU_RED,
  },
  buildingsCarousel: {
    paddingHorizontal: 24,
  },
});
