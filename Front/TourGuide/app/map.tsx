import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Region, Polygon } from 'react-native-maps';
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

const CMU_POLYGON = [
  { latitude: 40.448153, longitude: -79.952625}, // bellefield bayard
  { latitude: 40.448926, longitude: -79.950201}, // craig bayard top
  { latitude: 40.447616, longitude: -79.949334}, // craig bayard top bottom
  { latitude: 40.448108, longitude: -79.947684}, // north neville street top
  { latitude: 40.449257, longitude: -79.946435}, // ellsworth ellsworth terrace
  { latitude: 40.448859, longitude: -79.945814}, // ellsworth ellsworth terrace right
  { latitude: 40.448582, longitude: -79.946092}, // clyde shady oak court
  { latitude: 40.448318, longitude: -79.945691}, // clyde street
  { latitude: 40.448258, longitude: -79.945625}, // clyde street
  { latitude: 40.448094, longitude: -79.945496}, // clyde street
  { latitude: 40.447948, longitude: -79.945432}, // clyde street
  { latitude: 40.447270, longitude: -79.945338}, // clyde fifth
  { latitude: 40.447487, longitude: -79.942398}, // fifth morewood
  { latitude: 40.446715, longitude: -79.942275}, // morewood warwick
  { latitude: 40.446868, longitude: -79.940068}, // devon warwick
  { latitude: 40.446410, longitude: -79.939990}, // devon
  { latitude: 40.446269, longitude: -79.939975}, // devon
  { latitude: 40.446224, longitude: -79.939979}, // devon
  { latitude: 40.446133, longitude: -79.940003}, // devon
  { latitude: 40.446022, longitude: -79.940044}, // devon
  { latitude: 40.445942, longitude: -79.940093}, // devon
  { latitude: 40.445845, longitude: -79.940167}, // devon
  { latitude: 40.445437, longitude: -79.940550}, // devon
  { latitude: 40.445358, longitude: -79.940625}, // devon
  { latitude: 40.445257, longitude: -79.940708}, // devon
  { latitude: 40.445186, longitude: -79.940758}, // devon
  { latitude: 40.445028, longitude: -79.940847}, // devon
  { latitude: 40.444640, longitude: -79.938511}, // penton roads/scotties north
  { latitude: 40.444081, longitude: -79.938639}, // beeler top corner/forbes
  { latitude: 40.443961, longitude: -79.938556}, // beeler other side of road by 67 bus stop
  { latitude: 40.443906, longitude: -79.938695}, // beeler/forbes intersection
  { latitude: 40.442498, longitude: -79.937368}, // down forbes frame gallery
  { latitude: 40.442311, longitude: -79.937782}, // frame gallery ditch southwest of forbes
  { latitude: 40.442071, longitude: -79.937636}, // frame gallery ditch southwest of forbes
  { latitude: 40.441730, longitude: -79.937475}, // frame gallery ditch southwest of forbes
  { latitude: 40.441528, longitude: -79.937932}, // gladstone road
  { latitude: 40.441554, longitude: -79.938118}, // gladstone road
  { latitude: 40.441368, longitude: -79.938558}, // gladstone road
  { latitude: 40.441310, longitude: -79.938595}, // hammerschlag house
  { latitude: 40.441259, longitude: -79.938565}, // hammerschlag house
  { latitude: 40.441226, longitude: -79.938570}, // hammerschlag house
  { latitude: 40.440766, longitude: -79.939583}, // bottom ?? left of hammerschlag house corner
  { latitude: 40.441138, longitude: -79.939855}, // skibo house
  { latitude: 40.441428, longitude: -79.940515}, // margaret morrison skibo
  { latitude: 40.441310, longitude: -79.940853}, // highmark high right
  { latitude: 40.440213, longitude: -79.941324}, // frew st bottom right
  { latitude: 40.440395, longitude: -79.942324}, // frew tech 
  { latitude: 40.440438, longitude: -79.942370}, // frew tech 
  { latitude: 40.440509, longitude: -79.942570}, // frew tech 
  { latitude: 40.440555, longitude: -79.942817}, // frew tech 
  { latitude: 40.440537, longitude: -79.942823}, // frew runway
  { latitude: 40.441419, longitude: -79.947033}, // frew runway
  { latitude: 40.441439, longitude: -79.947023}, // frew runway left 
  { latitude: 40.441439, longitude: -79.947198}, // frew runway left 
  { latitude: 40.441412, longitude: -79.947295}, // frew runway left 
  { latitude: 40.441241, longitude: -79.947543}, // frew runway left 
  { latitude: 40.440666, longitude: -79.948241}, // frew schenely
  { latitude: 40.441295, longitude: -79.949325}, // S neville schenley
  { latitude: 40.441956, longitude: -79.948879}, // boundary street
  { latitude: 40.443317, longitude: -79.947678}, // boundary street
  { latitude: 40.443580, longitude: -79.947496}, // boundary street
  { latitude: 40.443699, longitude: -79.948360}, // cafe carnegie
  { latitude: 40.443755, longitude: -79.948405}, // cafe carnegie
  { latitude: 40.443781, longitude: -79.948460}, // cafe carnegie
  { latitude: 40.443797, longitude: -79.948515}, // cafe carnegie
  { latitude: 40.443807, longitude: -79.948557}, // cafe carnegie
  { latitude: 40.444316, longitude: -79.948718}, // forbes craig
  { latitude: 40.444331, longitude: -79.948763}, // forbes craig
  { latitude: 40.444279, longitude: -79.948959}, // forbes craig
  { latitude: 40.444234, longitude: -79.949004}, // forbes craig
  { latitude: 40.444156, longitude: -79.949328}, // forbes craig
  { latitude: 40.445733, longitude: -79.949564}, // winthrop craig
  { latitude: 40.445683, longitude: -79.950395}, // winthrop s dithridge
  { latitude: 40.445507, longitude: -79.951536}, // bellefield winthrop
  { latitude: 40.446206, longitude: -79.951847}, // fifth bellefield bottom
  { latitude: 40.446625, longitude: -79.951979}, // fifth bellefield intersection
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
          provider={undefined}
          customMapStyle={CMU_MAP_STYLE}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          <Polygon
            coordinates={CMU_POLYGON}
            strokeColor="#C41E3A"
            strokeWidth={1}
            fillColor="rgba(196, 30, 58, 0)"
            lineDashPattern={[5, 3]}
          />
        </MapView>
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

