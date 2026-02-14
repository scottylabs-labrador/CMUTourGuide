import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen() {
  const router = useRouter();
  const { unlockedBuildings, isUnlocked } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false)
  const [buildingId, setBuildingId] = React.useState("")
  const buildingKeys = Object.keys(buildings);
  const totalBuildings = buildingKeys.length;
  const unlockedCount = unlockedBuildings.length;
  const progressPercentage = totalBuildings > 0 ? (unlockedCount / totalBuildings) * 100 : 0;

  const scrollY = React.useRef(new Animated.Value(0)).current;
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

  const bgTopColor = scrollY.interpolate({
    inputRange: [0, 400],
    // Warm sunrise red at the very top, easing toward softer rose
    outputRange: ['#FFC4CC', '#FFB3BF'],
    extrapolate: 'clamp',
  });
  const bgMiddleColor = scrollY.interpolate({
    inputRange: [0, 400],
    // Soft misty light rose in the middle of the screen
    outputRange: ['#FFE8EE', '#FFDDE8'],
    extrapolate: 'clamp',
  });
  const bgBottomColor = scrollY.interpolate({
    inputRange: [0, 400],
    // Gentle warm pink near bottom, slightly deepening as you scroll
    outputRange: ['#FFEFF5', '#FFE0EC'],
    extrapolate: 'clamp',
  });

  return (
    <AnimatedLinearGradient
      colors={[bgTopColor as any, bgMiddleColor as any, bgBottomColor as any]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <Animated.ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>CMU Tour Guide</Text>
            <BlurView intensity={40} tint="light" style={styles.infoBlur}>
              <TouchableOpacity 
                onPress={() => router.push('/info')}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle-outline" size={20} color="#C41E3A" />
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Hero section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroSubtitle}>Ready to Explore</Text>
            <Text style={styles.heroTitle}>Carnegie Mellon!</Text>

            {/* Search pill (non-functional for now) */}
            <View style={styles.searchPill}>
              <View style={styles.searchLeft}>
                <Ionicons name="search" size={18} color="#8E9AAF" />
                <Text style={styles.searchPlaceholder}>
                  Find buildings…
                </Text>
              </View>
              <View style={styles.micButton}>
                <Ionicons name="mic-outline" size={18} color="#C41E3A" />
              </View>
            </View>
          </View>

          {/* Scan CTA card - camera icon is the button */}
          <BlurView intensity={40} tint="light" style={styles.scanCard}>
            <View style={styles.scanLeft}>
              <TouchableOpacity
                style={styles.scanIconCircle}
                onPress={handleScan}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={48} color="#C41E3A" />
              </TouchableOpacity>
              <View style={styles.scanTextContainer}>
                <Text style={styles.scanTitle} numberOfLines={1}>Scan a CMU marker</Text>
                <Text style={styles.scanSubtitle}>
                  Unlock building stories, trivia, and map pins.
                </Text>
              </View>
            </View>
          </BlurView>

          {/* Discovery Progress */}
          <BlurView intensity={30} tint="light" style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>Discovery Progress</Text>
                <Text style={styles.progressText}>{unlockedCount} / {totalBuildings}</Text>
                <Text style={styles.progressHint}>
                  Unlock more buildings to reveal campus stories.
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
          </BlurView>

          {/* Quick actions */}
          <View style={styles.actionsContainer}>
            <BlurView intensity={30} tint="light" style={styles.actionCard}>
              <TouchableOpacity
                style={styles.actionInner}
                onPress={handlePastChats}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name="chatbubbles-outline" size={22} color="#C41E3A" />
                </View>
                <Text style={styles.actionTitle}>Chats</Text>
                <Text style={styles.actionSubtitle}>
                  Ask questions & get hints.
                </Text>
              </TouchableOpacity>
            </BlurView>

            <BlurView intensity={30} tint="light" style={styles.actionCard}>
              <TouchableOpacity
                style={styles.actionInner}
                onPress={handleMapView}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>
                  <Ionicons name="map-outline" size={22} color="#C41E3A" />
                </View>
                <Text style={styles.actionTitle}>Map</Text>
                <Text style={styles.actionSubtitle}>
                  Find nearby landmarks.
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Buildings carousel */}
          <View style={styles.buildingsSection}>
            <View style={styles.buildingsHeaderRow}>
              <Text style={styles.sectionTitle}>Buildings</Text>
              <TouchableOpacity activeOpacity={0.7}>
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
                const building = buildings[buildingId as keyof typeof buildings];
                const unlocked = isUnlocked(buildingId);

                const scale = scrollXBuildings.interpolate({
                  inputRange: [
                    (index - 1) * BUILDING_SNAP_INTERVAL,
                    index * BUILDING_SNAP_INTERVAL,
                    (index + 1) * BUILDING_SNAP_INTERVAL,
                  ],
                  // center card largest, neighbors slightly smaller
                  outputRange: [0.9, 1.1, 0.9],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={buildingId}
                    style={{ transform: [{ scale }] }}
                  >
                    <TouchableOpacity
                      style={styles.buildingCard}
                      onPress={() => handleBuildingPress(buildingId)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.buildingImageContainer}>
                        {building.image_url ? (
                          <Image
                            source={{ uri: building.image_url }}
                            style={styles.buildingImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.buildingImagePlaceholder}>
                            <Ionicons name="business-outline" size={32} color="#999" />
                          </View>
                        )}
                        {!unlocked && (
                          <View style={styles.buildingLockedOverlay}>
                            <Ionicons name="lock-closed" size={18} color="#fff" />
                            <Text style={styles.lockedText}>Scan to unlock</Text>
                          </View>
                        )}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.35)', 'transparent']}
                          style={styles.buildingGradientTop}
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.55)']}
                          style={styles.buildingGradientBottom}
                        />
                        <View style={styles.buildingBadge}>
                          <Text style={styles.buildingBadgeText}>
                            {unlocked ? 'Unlocked' : 'Must‑See'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.buildingInfo}>
                        <Text style={styles.buildingName}>{building.title}</Text>
                        <Text style={styles.buildingSubtext}>
                          Scan to reveal fun facts.
                        </Text>
                      </View>
                    </TouchableOpacity>
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
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#C41E3A',
    letterSpacing: -0.5,
  },
  infoBlur: {
    borderRadius: 999,
    padding: 6,
    overflow: 'hidden',
  },
  heroSection: {
    marginBottom: 24,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#7A8593',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2933',
    marginBottom: 16,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  searchPlaceholder: {
    color: '#8E9AAF',
    fontSize: 14,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196,18,58,0.08)',
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    // very light pink, subtle tint
    backgroundColor: '#FFF3F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: 'rgba(196,18,58,0.08)',
    marginRight: 18,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 15,
    color: '#7A8593',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    borderRadius: 26,
    // same very light pink as other cards
    backgroundColor: '#FFF3F7',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: 'rgba(196,18,58,0.07)',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#7A8593',
  },
  mapContainer: {
    marginTop: 8,
  },
  mapPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  progressContainer: {
    // subtle very light pink background, easier to see
    backgroundColor: '#FFF3F7',
    borderRadius: 26,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  progressHeader: {
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 18,
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
  },
  progressHint: {
    fontSize: 13,
    color: '#7A8593',
    marginTop: 2,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C41E3A',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  progressLink: {
    fontSize: 13,
    color: '#C41E3A',
    marginTop: 2,
    alignSelf: 'flex-end',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 13,
    color: '#C41E3A',
    fontWeight: '500',
  },
  buildingsCarousel: {
    paddingHorizontal: 24,
  },
  buildingCard: {
    marginTop: 12,
    width: 210,
    borderRadius: 20,
    // match the soft pink bubbly cards above
    backgroundColor: '#FFF3F7',
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  buildingImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#e9ecef',
  },
  buildingImage: {
    width: '100%',
    height: '100%',
  },
  buildingImageLocked: {
    opacity: 0.4,
  },
  buildingImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  buildingLockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  lockedText: {
    marginTop: 4,
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  buildingGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  buildingGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  buildingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  buildingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C41E3A',
  },
  buildingInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buildingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  buildingSubtext: {
    fontSize: 12,
    color: '#7A8593',
    textAlign: 'center',
  },
  buildingNameLocked: {
    color: '#999',
  },
});
