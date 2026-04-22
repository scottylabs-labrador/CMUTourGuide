import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Polyline, Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useBuildings } from '../contexts/BuildingContext';
import {
  getAllBuildingIds,
  getBuilding,
  getBuildingOutline,
  getAllOutlineEntries,
} from '../services/buildingService';
import {
  getAllRoutes,
  getPathsForRoute,
  findNearestStopInRoute,
  haversineMeters,
} from '../services/routeService';
import { fetchWalkingRoute } from '../services/orsClient';
import {
  getMapBuildingColors,
  MAP_OUTLINE_NEUTRAL,
  CMU_RED,
  COLORS,
} from '../constants/colors';
import { SHADOWS } from '../constants/layout';
import {
  CMU_POLYGON,
  CMU_MAP_STYLE,
  INITIAL_REGION,
  CAMPUS_CENTER,
  OFF_CAMPUS_THRESHOLD_M,
} from '../constants/map';
import type { BuildingId, LatLng } from '../types/building';

interface CampusMapProps {
  style?: StyleProp<ViewStyle>;
  /** Called when an unlocked building marker is pressed. */
  onBuildingPress?: (id: string) => void;
  /** Show the floating "recenter" home button in the top-right corner. */
  showControls?: boolean;
  /** When provided, renders an expand button in the bottom-right corner. */
  onExpand?: () => void;
  /** When set, draws the polyline for this route on the map. */
  activeRouteId?: string | null;
}

// Marker labels are only readable when the visible region is reasonably zoomed
// in. Below this latitudeDelta, only the dot is shown to avoid overlap clutter.
const LABEL_VISIBLE_LAT_DELTA = 0.005;
// Default zoom-in level when we focus the map on the user's location.
const USER_FOCUS_LAT_DELTA = 0.005;

// All known route paths are mounted unconditionally on first render and
// toggled via strokeColor. Dynamically adding MKPolyline overlays after
// the MapView has settled crashes on iOS, so we pay a tiny perf cost to
// keep them stably mounted.
const ALL_ROUTE_PATHS = getAllRoutes().flatMap((route) =>
  getPathsForRoute(route.id).map((p) => ({ routeId: route.id, path: p }))
);

// Placeholder geometry for the approach polyline while it has no real data.
// We still mount it on first render for the same iOS-overlay reason as
// above, then swap its `coordinates` in place when ORS returns.
const APPROACH_PLACEHOLDER: LatLng[] = [
  CAMPUS_CENTER,
  { latitude: CAMPUS_CENTER.latitude + 1e-5, longitude: CAMPUS_CENTER.longitude + 1e-5 },
];
// Color for the user-to-nearest-stop connector. Distinct from CMU_RED used
// by route paths so the two read as different things.
const APPROACH_COLOR = '#1F6FEB';
// If the user is already within this many meters of the nearest stop, skip
// fetching an approach path — they're effectively there.
const APPROACH_SKIP_DISTANCE_M = 20;

export default function CampusMap({
  style,
  onBuildingPress,
  showControls = true,
  onExpand,
  activeRouteId = null,
}: CampusMapProps) {
  const { isUnlocked, isScannable } = useBuildings();
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [labelsVisible, setLabelsVisible] = useState(false);
  // Approach-path state: the walking polyline from the user to the nearest
  // stop in the active route, plus which stop that is. Both cleared when
  // there's no route, no location, or the user is off-campus.
  const [approachCoords, setApproachCoords] = useState<LatLng[] | null>(null);
  const [approachTarget, setApproachTarget] = useState<BuildingId | null>(null);
  const [offCampus, setOffCampus] = useState(false);
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

  // One-shot approach-path computation. Runs when the active route or the
  // user's location changes; does NOT re-run when a building unlocks — that
  // visibility is handled at render time via `approachVisible` below.
  useEffect(() => {
    if (!activeRouteId || !userLocation) {
      setApproachCoords(null);
      setApproachTarget(null);
      setOffCampus(false);
      return;
    }

    if (haversineMeters(userLocation, CAMPUS_CENTER) > OFF_CAMPUS_THRESHOLD_M) {
      setOffCampus(true);
      setApproachCoords(null);
      setApproachTarget(null);
      return;
    }
    setOffCampus(false);

    // Only consider stops the user hasn't unlocked yet — the approach line
    // is meant to guide them to their next tour destination, not something
    // they've already visited.
    const nearest = findNearestStopInRoute(
      activeRouteId,
      userLocation,
      (id) => !isUnlocked(id)
    );
    if (!nearest) {
      // Every stop in this route is already unlocked — nothing to approach.
      setApproachCoords(null);
      setApproachTarget(null);
      return;
    }
    setApproachTarget(nearest.id);

    if (nearest.distance < APPROACH_SKIP_DISTANCE_M) {
      setApproachCoords(null);
      return;
    }

    const target = getBuilding(nearest.id);
    if (!target?.latitude || !target?.longitude) {
      setApproachCoords(null);
      return;
    }

    const controller = new AbortController();
    fetchWalkingRoute(
      userLocation,
      { latitude: target.latitude, longitude: target.longitude },
      controller.signal
    )
      .then((r) => setApproachCoords(r.coordinates))
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('ORS approach fetch failed:', err);
          setApproachCoords(null);
        }
      });
    return () => controller.abort();
    // `isUnlocked` intentionally omitted so we don't re-fetch every time
    // a lock state flips; the post-unlock hide is handled by `approachVisible`
    // and the next activation of the route picks a fresh target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRouteId, userLocation?.latitude, userLocation?.longitude]);

  // Hide the approach path once its target building is unlocked — the user
  // has arrived, the connector has served its purpose.
  const approachVisible =
    !!approachCoords &&
    approachCoords.length >= 2 &&
    !!approachTarget &&
    !isUnlocked(approachTarget);

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

        {ALL_ROUTE_PATHS.map(({ routeId, path }) => {
          const active = routeId === activeRouteId;
          return (
            <Polyline
              key={`path-${routeId}-${path.from}-${path.to}`}
              coordinates={path.coordinates}
              strokeColor={active ? CMU_RED : 'transparent'}
              strokeWidth={1}
              lineDashPattern={[8, 6]}
            />
          );
        })}

        {/* Approach path: user → nearest stop. Mounted unconditionally with
            a placeholder so we never dynamically add an MKPolyline overlay
            to a settled MapView (same iOS-crash avoidance as above). */}
        <Polyline
          key="approach-path"
          coordinates={approachVisible ? approachCoords! : APPROACH_PLACEHOLDER}
          strokeColor={approachVisible ? APPROACH_COLOR : 'transparent'}
          strokeWidth={1}
          lineDashPattern={[4, 6]}
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

      {offCampus && activeRouteId && (
        <View
          className="absolute inset-0 items-center justify-center px-8"
          style={{ backgroundColor: COLORS.background }}
        >
          <Ionicons name="walk-outline" size={52} color={CMU_RED} />
          <Text
            className="font-serif-semi text-xl mt-4 text-center"
            style={{ color: COLORS.textPrimary }}
          >
            You're not on campus yet
          </Text>
          <Text
            className="font-sans text-base mt-2 text-center"
            style={{ color: COLORS.locked }}
          >
            Come to CMU's main campus to start this tour.
          </Text>
        </View>
      )}

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
