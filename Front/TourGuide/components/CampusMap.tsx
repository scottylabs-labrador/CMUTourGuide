import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useBuildings } from '../contexts/BuildingContext';
import {
  getAllBuildingIds,
  getBuilding,
  getBuildingOutline,
  getAllOutlineEntries,
} from '../services/buildingService';
import {
  getCategoryColors,
  getBaseOutlineColors,
  CMU_RED,
  COLORS,
} from '../constants/colors';
import type { BuildingCategory } from '../constants/colors';
import { SHADOWS } from '../constants/layout';
import { CMU_POLYGON, CMU_MAP_STYLE, INITIAL_REGION } from '../constants/map';

interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  /** Called when an unlocked building marker is pressed. */
  onBuildingPress?: (id: string) => void;
  /** Show floating home/compass buttons in the top-right corner. */
  showControls?: boolean;
  /** When provided, renders an expand button in the bottom-right corner. */
  onExpand?: () => void;
}

export default function CampusMap({
  style,
  onBuildingPress,
  showControls = true,
  onExpand,
}: CampusMapProps) {
  const { isUnlocked, isScannable } = useBuildings();
  const [locationGranted, setLocationGranted] = useState(false);
  const mapRef = useRef<MapView>(null);
  const initialCameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationGranted(status === 'granted');
      } catch (err) {
        console.warn('Location permission request failed:', err);
        setLocationGranted(false);
      }
    })();
  }, []);

  const buildingKeys = getAllBuildingIds();
  const buildingKeySet = new Set(buildingKeys);

  const resetHome = () => {
    if (!initialCameraRef.current || !mapRef.current) return;
    mapRef.current.animateCamera(
      { ...initialCameraRef.current, heading: 0, pitch: 0 },
      { duration: 750 }
    );
  };

  const resetNorth = () => {
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 750 });
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
          const colors = getBaseOutlineColors(data.category);
          return data.shapes.map((shape, i) => (
            <Polygon
              key={`outline-${code}-${i}`}
              coordinates={shape}
              strokeColor={colors.stroke}
              strokeWidth={1}
              fillColor={colors.fill}
            />
          ));
        })}

        {buildingKeys.map((id) => {
          const data = getBuildingOutline(id);
          if (!data) return null;
          const colors = getCategoryColors(data.category, isUnlocked(id));
          return data.shapes.map((shape, i) => (
            <Polygon
              key={`app-${id}-${i}`}
              coordinates={shape}
              strokeColor={colors.stroke}
              strokeWidth={1.5}
              fillColor={colors.fill}
            />
          ));
        })}

        {buildingKeys.map((id) => {
          const b = getBuilding(id);
          if (!b?.latitude || !b?.longitude) return null;
          const unlocked = isUnlocked(id);
          const scannable = isScannable(id);
          const showLocked = scannable && !unlocked;
          const category: BuildingCategory =
            getBuildingOutline(id)?.category ?? 'academic';
          const colors = getCategoryColors(category, unlocked);
          return (
            <Marker
              key={id}
              coordinate={{ latitude: b.latitude, longitude: b.longitude }}
              tracksViewChanges={false}
              stopPropagation
              onPress={() => handleMarkerPress(id, unlocked)}
            >
              <View className="items-center">
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

      {showControls && (
        <View className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <TouchableOpacity
            onPress={resetHome}
            activeOpacity={0.9}
            className="h-10 w-10 rounded-xl bg-white items-center justify-center shadow"
          >
            <Ionicons name="home" size={20} color={CMU_RED} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={resetNorth}
            activeOpacity={0.9}
            className="h-10 w-10 rounded-xl bg-white items-center justify-center shadow"
          >
            <Ionicons name="compass" size={20} color={CMU_RED} />
          </TouchableOpacity>
        </View>
      )}

      {onExpand && (
        <TouchableOpacity
          onPress={onExpand}
          activeOpacity={0.9}
          className="absolute bottom-3 right-3 z-10 h-10 w-10 rounded-xl bg-white items-center justify-center shadow"
        >
          <Ionicons name="expand-outline" size={20} color={CMU_RED} />
        </TouchableOpacity>
      )}
    </View>
  );
}
