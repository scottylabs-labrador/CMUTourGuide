import React from 'react';
<<<<<<< HEAD
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
=======
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
>>>>>>> frontend-edit-made-by-krish
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';
<<<<<<< HEAD

export default function HomeScreen() {
  const router = useRouter();
=======
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
>>>>>>> frontend-edit-made-by-krish
  const { unlockedBuildings, isUnlocked } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false)
  const [buildingId, setBuildingId] = React.useState("")
  const buildingKeys = Object.keys(buildings);
  const totalBuildings = buildingKeys.length;
  const unlockedCount = unlockedBuildings.length;
  const progressPercentage = totalBuildings > 0 ? (unlockedCount / totalBuildings) * 100 : 0;

<<<<<<< HEAD
=======
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

>>>>>>> frontend-edit-made-by-krish
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
<<<<<<< HEAD
      setShowSummaryPopup(true)
=======
      setShowSummaryPopup(true);
>>>>>>> frontend-edit-made-by-krish
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Building not unlocked", "Find the building to unlock it!");
    }
  };

<<<<<<< HEAD
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CMU Tour Guide</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => router.push('/info')}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="#C41E3A" />
          </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleScan}
          activeOpacity={0.9}
        >
          <View style={styles.mainButtonIcon}>
            <Ionicons name="camera" size={48} color="#C41E3A" />
          </View>
          <Text style={styles.mainButtonText}>Scan</Text>
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Discovery Progress</Text>
            <Text style={styles.progressText}>{unlockedCount} / {totalBuildings}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Secondary Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePastChats}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#C41E3A" />
            <Text style={styles.actionButtonText}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleMapView}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={24} color="#C41E3A" />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Buildings Grid */}
        <View style={styles.buildingsSection}>
          <Text style={styles.sectionTitle}>Buildings</Text>
          <View style={styles.buildingsGrid}>
            {buildingKeys.map((buildingId) => {
              const building = buildings[buildingId as keyof typeof buildings];
              const unlocked = isUnlocked(buildingId);
              
              return (
                <TouchableOpacity
                  key={buildingId}
                  style={[styles.buildingCard, !unlocked && styles.buildingCardLocked]}
                  onPress={() => handleBuildingPress(buildingId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buildingImageContainer}>
                    {building.image_url ? (
                      <Image
                        source={{ uri: building.image_url }}
                        style={[styles.buildingImage, !unlocked && styles.buildingImageLocked]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.buildingImagePlaceholder, !unlocked && styles.buildingImageLocked]}>
                        <Ionicons name="business-outline" size={32} color={unlocked ? "#C41E3A" : "#999"} />
                      </View>
                    )}
                    {!unlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.buildingName, !unlocked && styles.buildingNameLocked]} numberOfLines={2}>
                    {building.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <SummaryModal
        visible={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
        building_id={buildingId}
        isNewUnlock={false}
      />
    </SafeAreaView>
=======
  const HEADER_SCROLL_RANGE = 260;
  // Logo and above: red. Below the logo: white, sharp transition (no pinkish hue)
  const bgTopColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE, 400],
    outputRange: ['#C41230', '#F8F9FA', '#F8F9FA'],
    extrapolate: 'clamp',
  });
  const bgMiddleColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE, 400],
    outputRange: ['#FFFFFF', '#F1F3F5', '#F1F3F5'],
    extrapolate: 'clamp',
  });
  const bgBottomColor = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE, 400],
    outputRange: ['#FFFFFF', '#E9ECEF', '#E9ECEF'],
    extrapolate: 'clamp',
  });
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
    <AnimatedLinearGradient
      colors={[bgTopColor as any, bgMiddleColor as any, bgBottomColor as any]}
      locations={[0, 0.12, 1]}
      style={styles.gradientBackground}
    >
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
            { useNativeDriver: false }
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
          <BlurView intensity={40} tint="light" style={styles.scanCard}>
            <View style={styles.scanLeft}>
              <TouchableOpacity
                style={styles.scanIconCircle}
                onPress={handleScan}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={48} color="#C41230" />
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
                  <Ionicons name="chatbubbles-outline" size={22} color="#C41230" />
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
                  <Ionicons name="map-outline" size={22} color="#C41230" />
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
>>>>>>> frontend-edit-made-by-krish
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
=======
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
>>>>>>> frontend-edit-made-by-krish
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
<<<<<<< HEAD
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    marginTop: 12,
    position: 'relative',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#C41E3A',
    letterSpacing: -0.5,
  },
  mainButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#C41E3A',
    borderStyle: 'dashed',
  },
  mainButtonIcon: {
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C41E3A',
=======
    paddingTop: 0,
    paddingBottom: 40,
  },
  topRedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C41230',
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
    backgroundColor: '#C41230',
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderRadius: 0,
  },
  fixedHeaderLogo: {
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
  },
  fixedHeaderInfoBtn: {
    padding: 4,
    marginLeft: 8,
  },
  heroLogoBlock: {
    backgroundColor: '#C41230',
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
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroLogoLine2: {
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginTop: -4,
  },
  heroLogoLine3: {
    fontFamily: 'SourceSerifPro_600SemiBold',
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
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 36,
    color: '#C41230',
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
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 16,
    color: '#7A8593',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 28,
    color: '#1F2933',
    marginBottom: 8,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#F1F3F5',
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
    backgroundColor: 'rgba(196,18,48,0.08)',
    marginRight: 18,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 17,
    color: '#1F2933',
    marginBottom: 4,
  },
  scanSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 15,
    color: '#7A8593',
>>>>>>> frontend-edit-made-by-krish
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
<<<<<<< HEAD
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C41E3A',
    marginTop: 8,
=======
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: '#F1F3F5',
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
    backgroundColor: 'rgba(196,18,48,0.07)',
    marginBottom: 10,
  },
  actionTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 15,
    color: '#1F2933',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#7A8593',
>>>>>>> frontend-edit-made-by-krish
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
<<<<<<< HEAD
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
=======
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 16,
    color: '#999',
    marginTop: 12,
>>>>>>> frontend-edit-made-by-krish
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  progressContainer: {
<<<<<<< HEAD
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C41E3A',
=======
    backgroundColor: '#F1F3F5',
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
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 18,
    textAlign: 'left',
    color: '#333',
  },
  progressHint: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#7A8593',
    marginTop: 2,
  },
  progressText: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 18,
    color: '#C41230',
    marginTop: 2,
>>>>>>> frontend-edit-made-by-krish
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
<<<<<<< HEAD
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  buildingsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  buildingCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buildingCardLocked: {
    opacity: 0.6,
  },
  buildingImageContainer: {
    width: '100%',
    height: 120,
=======
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C41230',
    borderRadius: 4,
  },
  progressLink: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#C41230',
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
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 20,
    color: '#333',
  },
  seeAllText: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#C41230',
  },
  buildingsCarousel: {
    paddingHorizontal: 24,
  },
  buildingCard: {
    marginTop: 12,
    width: 210,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
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
>>>>>>> frontend-edit-made-by-krish
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
<<<<<<< HEAD
  lockOverlay: {
=======
  buildingLockedOverlay: {
>>>>>>> frontend-edit-made-by-krish
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
<<<<<<< HEAD
  buildingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 12,
=======
  lockedText: {
    fontFamily: 'SourceSerifPro_400Regular',
    marginTop: 4,
    fontSize: 12,
    color: '#fff',
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
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 11,
    color: '#C41230',
  },
  buildingInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buildingName: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  buildingSubtext: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 12,
    color: '#7A8593',
>>>>>>> frontend-edit-made-by-krish
    textAlign: 'center',
  },
  buildingNameLocked: {
    color: '#999',
  },
});
