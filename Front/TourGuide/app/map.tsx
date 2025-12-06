import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_IMAGE_WIDTH = 2546;
const MAP_IMAGE_HEIGHT = 1854;
const MAP_ASPECT_RATIO = MAP_IMAGE_WIDTH / MAP_IMAGE_HEIGHT;

export default function MapScreen() {
  const router = useRouter();
  const { unlockedBuildings, isUnlocked } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  
  const buildingKeys = Object.keys(buildings);
  const totalBuildings = buildingKeys.length;
  const unlockedCount = unlockedBuildings.length;
  const progressPercentage = totalBuildings > 0 ? (unlockedCount / totalBuildings) * 100 : 0;

  // Gesture state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Calculate initial map dimensions to fit screen
  const getInitialMapDimensions = () => {
    const screenAspect = SCREEN_WIDTH / (SCREEN_HEIGHT - 200); // Account for header/progress
    let mapWidth, mapHeight;
    
    if (MAP_ASPECT_RATIO > screenAspect) {
      // Map is wider - fit to width
      mapWidth = SCREEN_WIDTH;
      mapHeight = SCREEN_WIDTH / MAP_ASPECT_RATIO;
    } else {
      // Map is taller - fit to height
      mapHeight = SCREEN_HEIGHT - 200;
      mapWidth = (SCREEN_HEIGHT - 200) * MAP_ASPECT_RATIO;
    }
    
    return { mapWidth, mapHeight };
  };

  const { mapWidth: initialMapWidth, mapHeight: initialMapHeight } = getInitialMapDimensions();

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      // Limit zoom between 1x (default) and 3x
      scale.value = Math.max(1, Math.min(3, newScale));
      
      // Constrain pan when zooming to prevent whitespace
      const scaledMapWidth = initialMapWidth * scale.value;
      const scaledMapHeight = initialMapHeight * scale.value;
      
      // Horizontal bounds
      const maxTranslateX = Math.max(0, (scaledMapWidth - SCREEN_WIDTH) / 2);
      const minTranslateX = -maxTranslateX;
      
      // Vertical bounds
      const mapContainerHeight = SCREEN_HEIGHT - 200;
      const maxTranslateY = Math.max(0, (scaledMapHeight - mapContainerHeight) / 2);
      const minTranslateY = -maxTranslateY;
      
      translateX.value = Math.max(minTranslateX, Math.min(maxTranslateX, translateX.value));
      translateY.value = Math.max(minTranslateY, Math.min(maxTranslateY, translateY.value));
    })
    .onEnd(() => {
      // Clamp to valid range on end
      savedScale.value = Math.max(1, Math.min(3, scale.value));
      scale.value = savedScale.value;
      
      // Ensure pan is within bounds after zoom
      const scaledMapWidth = initialMapWidth * scale.value;
      const scaledMapHeight = initialMapHeight * scale.value;
      
      // Horizontal bounds
      const maxTranslateX = Math.max(0, (scaledMapWidth - SCREEN_WIDTH) / 2);
      const minTranslateX = -maxTranslateX;
      
      // Vertical bounds
      const mapContainerHeight = SCREEN_HEIGHT - 200;
      const maxTranslateY = Math.max(0, (scaledMapHeight - mapContainerHeight) / 2);
      const minTranslateY = -maxTranslateY;
      
      translateX.value = Math.max(minTranslateX, Math.min(maxTranslateX, translateX.value));
      translateY.value = Math.max(minTranslateY, Math.min(maxTranslateY, translateY.value));
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pan gesture for moving the map
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newTranslateX = savedTranslateX.value + e.translationX;
      const newTranslateY = savedTranslateY.value + e.translationY;
      
      // Calculate bounds based on current scale
      const currentScale = scale.value;
      const scaledMapWidth = initialMapWidth * currentScale;
      const scaledMapHeight = initialMapHeight * currentScale;
      
      // Horizontal bounds: prevent showing whitespace on left/right
      const maxTranslateX = Math.max(0, (scaledMapWidth - SCREEN_WIDTH) / 2);
      const minTranslateX = -maxTranslateX;
      
      // Vertical bounds: prevent showing whitespace on top/bottom
      const mapContainerHeight = SCREEN_HEIGHT - 200;
      const maxTranslateY = Math.max(0, (scaledMapHeight - mapContainerHeight) / 2);
      const minTranslateY = -maxTranslateY;
      
      // Clamp horizontal movement
      translateX.value = Math.max(minTranslateX, Math.min(maxTranslateX, newTranslateX));
      
      // Clamp vertical movement
      translateY.value = Math.max(minTranslateY, Math.min(maxTranslateY, newTranslateY));
    })
    .onEnd(() => {
      // Calculate bounds based on current scale
      const currentScale = scale.value;
      const scaledMapWidth = initialMapWidth * currentScale;
      const scaledMapHeight = initialMapHeight * currentScale;
      
      // Horizontal bounds
      const maxTranslateX = Math.max(0, (scaledMapWidth - SCREEN_WIDTH) / 2);
      const minTranslateX = -maxTranslateX;
      
      // Vertical bounds
      const mapContainerHeight = SCREEN_HEIGHT - 200;
      const maxTranslateY = Math.max(0, (scaledMapHeight - mapContainerHeight) / 2);
      const minTranslateY = -maxTranslateY;
      
      // Ensure final position is within bounds
      translateX.value = Math.max(minTranslateX, Math.min(maxTranslateX, translateX.value));
      translateY.value = Math.max(minTranslateY, Math.min(maxTranslateY, translateY.value));
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combined gesture
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for map container
  const mapAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleMapPress = (event: any) => {
    // TODO: Map tap coordinates to building IDs
    // For now, we'll implement this later when we have building coordinates
    const { locationX, locationY } = event.nativeEvent;
    console.log('Map tapped at:', locationX, locationY);
  };

  const handleBuildingPress = (buildingId: string) => {
    if (isUnlocked(buildingId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedBuildingId(buildingId);
      setShowSummaryPopup(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Building Locked', 'Find and scan this building to unlock it!');
    }
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  };

  const resetMapView = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#C41E3A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Map</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetMapView}
          >
            <Ionicons name="refresh" size={24} color="#C41E3A" />
          </TouchableOpacity>
        </View>

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

        {/* Interactive Map Container */}
        <View style={styles.mapContainer}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.mapWrapper, mapAnimatedStyle]}>
              <Image
                source={require('../assets/images/CMU_map.png')}
                style={[
                  styles.mapImage,
                  {
                    width: initialMapWidth,
                    height: initialMapHeight,
                  },
                ]}
                resizeMode="contain"
              />
              {/* Building overlays will go here - TODO: Add building coordinate mapping */}
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Map Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleScan}
            activeOpacity={0.9}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>

        <SummaryModal
          visible={showSummaryPopup}
          onClose={() => setShowSummaryPopup(false)}
          building_id={selectedBuildingId}
          isNewUnlock={false}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C41E3A',
  },
  resetButton: {
    padding: 8,
  },
  progressContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C41E3A',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 3,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  mapWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    // Dimensions set dynamically based on aspect ratio
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  scanButton: {
    backgroundColor: '#C41E3A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

