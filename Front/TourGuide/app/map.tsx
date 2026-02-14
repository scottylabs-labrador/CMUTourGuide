import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Region } from 'react-native-maps';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';

const INITIAL_REGION: Region = {
  latitude: 40.4433,
  longitude: -79.9436,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CMU_BOUNDS = {
  minLatitude: 40.4385,
  maxLatitude: 40.4478,
  minLongitude: -79.9495,
  maxLongitude: -79.9360,
};

const CMU_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export default function MapScreen() {
  const router = useRouter();
  const { unlockedBuildings } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const mapRef = useRef<MapView>(null);
  
  const buildingKeys = Object.keys(buildings);
  const totalBuildings = buildingKeys.length;
  const unlockedCount = unlockedBuildings.length;
  const progressPercentage = totalBuildings > 0 ? (unlockedCount / totalBuildings) * 100 : 0;

  const handleScan = () => {
    router.push('/camera');
  };

  const resetMapView = () => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 300);
  };

  const clampRegion = (region: Region): Region => {
    const maxLatDelta = CMU_BOUNDS.maxLatitude - CMU_BOUNDS.minLatitude;
    const maxLngDelta = CMU_BOUNDS.maxLongitude - CMU_BOUNDS.minLongitude;
    const latitudeDelta = Math.min(region.latitudeDelta, maxLatDelta);
    const longitudeDelta = Math.min(region.longitudeDelta, maxLngDelta);

    const halfLat = latitudeDelta / 2;
    const halfLng = longitudeDelta / 2;
    const minLatCenter = CMU_BOUNDS.minLatitude + halfLat;
    const maxLatCenter = CMU_BOUNDS.maxLatitude - halfLat;
    const minLngCenter = CMU_BOUNDS.minLongitude + halfLng;
    const maxLngCenter = CMU_BOUNDS.maxLongitude - halfLng;

    const latitude = Math.min(Math.max(region.latitude, minLatCenter), maxLatCenter);
    const longitude = Math.min(Math.max(region.longitude, minLngCenter), maxLngCenter);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };

  const handleRegionChangeComplete = (region: Region) => {
    const clampedRegion = clampRegion(region);
    const shouldClamp =
      Math.abs(clampedRegion.latitude - region.latitude) > 0.000001 ||
      Math.abs(clampedRegion.longitude - region.longitude) > 0.000001 ||
      Math.abs(clampedRegion.latitudeDelta - region.latitudeDelta) > 0.000001 ||
      Math.abs(clampedRegion.longitudeDelta - region.longitudeDelta) > 0.000001;

    if (shouldClamp) {
      mapRef.current?.animateToRegion(clampedRegion, 200);
    }
  };

  return (
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
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          provider="google"
          customMapStyle={CMU_MAP_STYLE}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
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
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 20,
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
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 14,
    color: '#333',
  },
  progressText: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 14,
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
  map: {
    flex: 1,
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
    fontFamily: 'SourceSerifPro_600SemiBold',
    color: 'white',
    fontSize: 16,
  },
});

