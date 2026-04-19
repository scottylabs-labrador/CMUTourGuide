import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useBuildings } from '../contexts/BuildingContext';
import {
  getAllBuildingIds,
  getBuilding,
  getBuildingOutline,
  getAllOutlineEntries,
} from '../services/buildingService';
import {
  getMapBuildingColors,
  MAP_OUTLINE_NEUTRAL,
  CMU_RED,
  COLORS,
} from '../constants/colors';
import { SHADOWS } from '../constants/layout';
import { CMU_POLYGON, CMU_MAP_STYLE, INITIAL_REGION } from '../constants/map';

interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  /** Called when an unlocked building marker is pressed. */
  onBuildingPress?: (id: string) => void;
  /** Show the floating "recenter" home button in the top-right corner. */
  showControls?: boolean;
  /** When provided, renders an expand button in the bottom-right corner. */
  onExpand?: () => void;
}

// Marker labels are only readable when the visible region is reasonably zoomed
// in. Below this latitudeDelta, only the dot is shown to avoid overlap clutter.
const LABEL_VISIBLE_LAT_DELTA = 0.005;
// Default zoom-in level when we focus the map on the user's location.
const USER_FOCUS_LAT_DELTA = 0.005;

export default function CampusMap({
  style,
  onBuildingPress,
  showControls = true,
  onExpand,
}: CampusMapProps) {
  const { isUnlocked, isScannable } = useBuildings();
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const initialCameraRef = useRef<any>(null);
  const mapReadyRef = useRef(false);
  const focusedOnUserRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setLocationGranted(granted);
        if (!granted) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.warn('Location lookup failed:', err);
        setLocationGranted(false);
      }
    })();
  }, []);

  // Once both the map is ready and we know the user's location, gently fly
  // there at a closer zoom — but only the first time, so we don't fight the
  // user's manual panning.
  const focusOnUser = () => {
    if (focusedOnUserRef.current) return;
    if (!mapReadyRef.current || !userLocation || !mapRef.current) return;
    focusedOnUserRef.current = true;
    mapRef.current.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: USER_FOCUS_LAT_DELTA,
        longitudeDelta: USER_FOCUS_LAT_DELTA,
      },
      900
    );
  };
  useEffect(() => {
    focusOnUser();
  }, [userLocation]);

  const buildingKeys = getAllBuildingIds();
  const buildingKeySet = new Set(buildingKeys);

  const resetHome = () => {
    if (!initialCameraRef.current || !mapRef.current) return;
    mapRef.current.animateCamera(
      { ...initialCameraRef.current, heading: 0, pitch: 0 },
      { duration: 750 }
    );
  };

  const handleMarkerPress = (id: string, unlocked: boolean) => {
    if (unlocked) {
      onBuildingPress?.(id);
    } else {
      Alert.alert('Locked', 'Scan this building to unlock it!');
    }
  };

  return (
    <View className="overflow-hidden relative bg-slate-100" style={[{ flex: 1 }, style]}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={INITIAL_REGION}
        customMapStyle={CMU_MAP_STYLE}
        showsBuildings
        showsIndoors={false}
        showsPointsOfInterest={false}
        showsTraffic={false}
        onMapReady={async () => {
          if (!initialCameraRef.current && mapRef.current) {
            initialCameraRef.current = await mapRef.current.getCamera();
          }
          mapReadyRef.current = true;
          focusOnUser();
        }}
        onRegionChangeComplete={(region: Region) => {
          setLabelsVisible(region.latitudeDelta < LABEL_VISIBLE_LAT_DELTA);
        }}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        rotateEnabled
        pitchEnabled
        scrollEnabled
        zoomEnabled
      >
        <Polygon
          coordinates={CMU_POLYGON}
          strokeColor={CMU_RED}
          strokeWidth={1}
          fillColor="rgba(196, 30, 58, 0)"
          lineDashPattern={[5, 3]}
        />

        {getAllOutlineEntries().map(([code, data]) => {
          if (buildingKeySet.has(code)) return null;
          return data.shapes.map((shape, i) => (
            <Polygon
              key={`outline-${code}-${i}`}
              coordinates={shape}
              strokeColor={MAP_OUTLINE_NEUTRAL.stroke}
              strokeWidth={1}
              fillColor={MAP_OUTLINE_NEUTRAL.fill}
            />
          ));
        })}

        {buildingKeys.map((id) => {
          const data = getBuildingOutline(id);
          if (!data) return null;
          const unlocked = isUnlocked(id);
          const colors = getMapBuildingColors(unlocked);
          return data.shapes.map((shape, i) => (
            <Polygon
              key={`app-${id}-${i}`}
              coordinates={shape}
              strokeColor={colors.stroke}
              strokeWidth={1}
              fillColor={colors.fill}
              tappable
              onPress={() => handleMarkerPress(id, unlocked)}
            />
          ));
        })}

        {buildingKeys.map((id) => {
          const b = getBuilding(id);
          if (!b?.latitude || !b?.longitude) return null;
          const unlocked = isUnlocked(id);
          const scannable = isScannable(id);
          const showLocked = scannable && !unlocked;
          const colors = getMapBuildingColors(unlocked);
          return (
            <Marker
              // Re-key on label visibility so the native marker bitmap is
              // re-captured when the label appears/disappears.
              key={`${id}-${labelsVisible ? 'lbl' : 'dot'}`}
              coordinate={{ latitude: b.latitude, longitude: b.longitude }}
              tracksViewChanges={false}
              stopPropagation
              onPress={() => handleMarkerPress(id, unlocked)}
            >
              <View className="items-center">
                {labelsVisible && (
                  <View
                    className="flex-row items-center px-1 py-[2px] rounded-[4px] mb-[2px]"
                    style={[{ backgroundColor: 'rgba(255,255,255,0.85)' }, SHADOWS.marker]}
                  >
                    {showLocked && (
                      <Ionicons
                        name="lock-closed"
                        size={10}
                        color={COLORS.locked}
                        style={{ marginRight: 3 }}
                      />
                    )}
                    <Text
                      className="font-serif-semi text-[11px] text-center"
                      style={{
                        color: showLocked ? COLORS.locked : CMU_RED,
                        maxWidth: 100,
                      }}
                      numberOfLines={1}
                    >
                      {b.title}
                    </Text>
                  </View>
                )}
                <View
                  className="w-[10px] h-[10px] rounded-[5px] border-2 border-white"
                  style={{ backgroundColor: colors.dot }}
                />
              </View>
              <Callout tooltip>
                <View />
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {(showControls || onExpand) && (
        <View className="absolute bottom-3 right-3 z-10 flex flex-row gap-2">
          {showControls && (
            <TouchableOpacity
              onPress={resetHome}
              activeOpacity={0.9}
              className="h-10 w-10 rounded-xl bg-white items-center justify-center shadow"
            >
              <Ionicons name="home" size={20} color={CMU_RED} />
            </TouchableOpacity>
          )}

          {onExpand && (
            <TouchableOpacity
              onPress={onExpand}
              activeOpacity={0.9}
              className="h-10 w-10 rounded-xl bg-white items-center justify-center shadow"
            >
              <Ionicons name="expand-outline" size={20} color={CMU_RED} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
