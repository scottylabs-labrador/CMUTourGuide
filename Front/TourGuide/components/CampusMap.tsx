import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleProp,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Polyline, Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useBuildings } from '../contexts/BuildingContext';
import { isLandmark } from '../config/scannableBuildings';
import {
  getAllBuildingIds,
  getBuilding,
  getBuildingOutline,
  getAllOutlineEntries,
  getEntrance,
} from '../services/buildingService';
import {
  getAllRoutes,
  getPathsForRoute,
  findNearestStopInRoute,
  haversineMeters,
  getRoute,
} from '../services/routeService';
import { fetchWalkingRoute } from '../services/orsClient';
import {
  getMapBuildingStyle,
  MAP_OUTLINE_NEUTRAL,
  CMU_RED,
  COLORS,
  LANDMARK_YELLOW,
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

// Dev-only location override. When true, skips the real GPS lookup and seeds
// the user's location to FAKE_CAMPUS_LOCATION so on-campus behavior can be
// tested from anywhere (e.g. while developing abroad).
const USE_FAKE_LOCATION = true;
const FAKE_CAMPUS_LOCATION: LatLng = {
  latitude: 40.4440,
  longitude: -79.9448,
};

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

// RGB channels of CMU_RED (#C41230), used to build rgba strings with an
// animated alpha for the full-route peek.
const CMU_RED_RGB = '196, 18, 48';
// Peek timing: fade-in → hold → fade-out.
const PEEK_FADE_IN_MS = 200;
const PEEK_HOLD_MS = 2500;
const PEEK_FADE_OUT_MS = 500;

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
  // Fetched approach path, tagged with the target it was fetched for.
  // Tagging lets us ignore stale coords if the target has since advanced
  // (e.g. user just unlocked the previous nearest stop).
  const [approach, setApproach] = useState<{
    target: BuildingId;
    coords: LatLng[];
  } | null>(null);
  const [offCampus, setOffCampus] = useState(false);
  const mapRef = useRef<MapView>(null);
  const initialCameraRef = useRef<any>(null);
  const mapReadyRef = useRef(false);
  const focusedOnUserRef = useRef(false);

  // Animated alpha (0..1) for the "peek full route" reveal. A JS-side
  // Animated.Value feeds a state mirror via a listener so we can use it to
  // build an rgba strokeColor — Polyline doesn't accept Animated props.
  const peekAnim = useRef(new Animated.Value(0)).current;
  const peekSeqRef = useRef<Animated.CompositeAnimation | null>(null);
  const [peekAlpha, setPeekAlpha] = useState(0);
  useEffect(() => {
    const id = peekAnim.addListener(({ value }) => setPeekAlpha(value));
    return () => {
      peekAnim.removeListener(id);
      peekSeqRef.current?.stop();
    };
  }, [peekAnim]);
  const peekFullRoute = () => {
    peekSeqRef.current?.stop();
    peekAnim.setValue(0);
    peekSeqRef.current = Animated.sequence([
      Animated.timing(peekAnim, {
        toValue: 1,
        duration: PEEK_FADE_IN_MS,
        useNativeDriver: false,
      }),
      Animated.delay(PEEK_HOLD_MS),
      Animated.timing(peekAnim, {
        toValue: 0,
        duration: PEEK_FADE_OUT_MS,
        useNativeDriver: false,
      }),
    ]);
    peekSeqRef.current.start();
  };

  useEffect(() => {
    if (USE_FAKE_LOCATION) {
      setLocationGranted(true);
      setUserLocation(FAKE_CAMPUS_LOCATION);
      return;
    }
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

  // Derived: the nearest LOCKED stop in the active route. Recomputed on
  // every render (cheap — routes are short). This is the single source of
  // truth for "where should the user head next," and it automatically
  // advances the moment the user unlocks their current target.
  const nextTargetId: BuildingId | null =
    activeRouteId && userLocation
      ? findNearestStopInRoute(activeRouteId, userLocation, (id) => !isUnlocked(id))?.id ?? null
      : null;

  // Fetch (or clear) the approach polyline whenever the active route, the
  // user's location, or — critically — the next target changes. Re-running
  // on nextTargetId is what makes the line auto-advance after an unlock.
  useEffect(() => {
     if (!userLocation) {
       setOffCampus(false);
       return;
     }
     setOffCampus(
       haversineMeters(userLocation, CAMPUS_CENTER) > OFF_CAMPUS_THRESHOLD_M
     );
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (!activeRouteId || !userLocation) {
      setApproach(null);
      return;
    }

    if (haversineMeters(userLocation, CAMPUS_CENTER) > OFF_CAMPUS_THRESHOLD_M) {
      setApproach(null);
      return;
    }

    if (!nextTargetId) {
      // Every stop in this route is already unlocked — nothing to approach.
      setApproach(null);
      return;
    }

    // Route to the entrance, not the polygon center — otherwise ORS
    // routinely snaps to whichever side door is nearest the centroid.
    const targetLatLng = getEntrance(nextTargetId);
    if (!targetLatLng) {
      setApproach(null);
      return;
    }

    // If the user is essentially standing on the entrance, skip the
    // fetch — a polyline would be visual noise. The thick building
    // outline still conveys "this is your next stop."
    if (haversineMeters(userLocation, targetLatLng) < APPROACH_SKIP_DISTANCE_M) {
      setApproach(null);
      return;
    }

    const controller = new AbortController();
    fetchWalkingRoute(userLocation, targetLatLng, controller.signal)
      .then((r) =>
        setApproach({ target: nextTargetId, coords: r.coordinates })
      )
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('ORS approach fetch failed:', err);
          setApproach(null);
        }
      });
    return () => controller.abort();
  }, [activeRouteId, userLocation?.latitude, userLocation?.longitude, nextTargetId]);

  // Visible only when the fetched coords match the *current* target. If
  // the target has advanced and a new fetch is in flight, this goes false
  // until the new coords arrive — preventing a stale path from briefly
  // pointing to an already-unlocked building.
  const approachVisible =
    !!approach &&
    approach.coords.length >= 2 &&
    approach.target === nextTargetId;

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

  // Route-aware styling inputs, computed once per render so the Polygon
  // and Marker passes stay cheap.
  const activeRoute = activeRouteId ? getRoute(activeRouteId) : null;
  const routeActive = !!activeRoute;
  const routeStopIds = new Set<BuildingId>(activeRoute?.stops ?? []);
  // Use the synchronously-derived target so the "next stop" styling
  // updates on the same render as an unlock, rather than waiting a beat
  // for the approach-path effect to run.
  const nextStopId = nextTargetId;

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
        pitchEnabled={false}
        scrollEnabled
        zoomEnabled
      >
        <Polygon
          coordinates={CMU_POLYGON}
          strokeColor={'rgba(100, 116, 139, 0.7)'}
          strokeWidth={1}
          lineDashPattern={[5, 3]}
        />

        {ALL_ROUTE_PATHS.map(({ routeId, path }) => {
          const active = routeId === activeRouteId;
          // Active route polylines stay mounted but fade in/out via the
          // peek alpha. Inactive route polylines are always transparent.
          const strokeColor = active
            ? `rgba(${CMU_RED_RGB}, ${peekAlpha})`
            : 'transparent';
          return (
            <Polyline
              key={`path-${routeId}-${path.from}-${path.to}`}
              coordinates={path.coordinates}
              strokeColor={strokeColor}
              strokeWidth={1}
              lineDashPattern={[3, 2]}
            />
          );
        })}

        {/* Approach path: user → nearest stop. Mounted unconditionally with
            a placeholder so we never dynamically add an MKPolyline overlay
            to a settled MapView (same iOS-crash avoidance as above). */}
        <Polyline
          key="approach-path"
          coordinates={approachVisible ? approach!.coords : APPROACH_PLACEHOLDER}
          strokeColor={approachVisible ? CMU_RED : 'transparent'}
          strokeWidth={1}
          lineDashPattern={[3, 2]}
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
          const inRoute = routeStopIds.has(id);
          const isNext = routeActive && id === nextStopId;
          const style = getMapBuildingStyle({
            unlocked,
            inRoute,
            isNext,
            routeActive,
          });
          return data.shapes.map((shape, i) => (
            <Polygon
              key={`app-${id}-${i}`}
              coordinates={shape}
              strokeColor={style.stroke}
              strokeWidth={style.strokeWidth}
              fillColor={style.fill}
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
          const inRoute = routeStopIds.has(id);
          const isNext = routeActive && id === nextStopId;
          const baseStyle = getMapBuildingStyle({
            unlocked,
            inRoute,
            isNext,
            routeActive,
          });

          const landmark = isLandmark(id);
          const style = landmark
            ? { ...baseStyle, dot: LANDMARK_YELLOW, showCheck: false }
            : baseStyle;
          const labelColor = landmark
            ? LANDMARK_YELLOW
            : showLocked
              ? COLORS.locked
              : CMU_RED;
          // Include route-state bits in the key so the native marker
          // bitmap is re-captured when membership/next-stop/unlock changes
          // (same mechanism as the existing label-visibility rekey).
          const styleSig = `u${unlocked ? 1 : 0}r${inRoute ? 1 : 0}n${
            isNext ? 1 : 0
          }a${routeActive ? 1 : 0}l${landmark ? 1 : 0}`;
          return (
            <Marker
              key={`${id}-${labelsVisible ? 'lbl' : 'dot'}-${styleSig}`}
              coordinate={{ latitude: b.latitude, longitude: b.longitude }}
              tracksViewChanges={false}
              stopPropagation
              onPress={() => handleMarkerPress(id, unlocked)}
            >
              <View className="items-center" style={{ opacity: style.opacity }}>
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
                    {style.showCheck && (
                      <Ionicons
                        name="checkmark-circle"
                        size={11}
                        color={CMU_RED}
                        style={{ marginRight: 3 }}
                      />
                    )}
                    <Text
                      className="font-serif-semi text-[11px] text-center"
                      style={{
                        color: labelColor,
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
                  style={{ backgroundColor: style.dot }}
                />
              </View>
              <Callout tooltip>
                <View />
              </Callout>
            </Marker>
          );
        })}

      </MapView>

      {offCampus && (
        <View
          className="absolute inset-0 items-center justify-center px-8"
          style={{ backgroundColor: COLORS.background, zIndex: 20 }}
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
            {activeRouteId
              ? "Come to CMU's main campus to start this tour."
              : "Come to CMU's main campus to explore."}
          </Text>
        </View>
      )}

      {/* Route chip — small, bottom-left corner. When a route is active,
          tells the user which route and the next locked stop, and tapping
          peeks the full polyline. When no route is active, shows a
          placeholder prompting the user to pick one. Sits above the
          off-campus overlay via zIndex. */}
      {(() => {
        const route = activeRouteId ? getRoute(activeRouteId) : null;
        const nextStopBuilding =
          route && nextTargetId ? getBuilding(nextTargetId) : null;
        const hasRoute = !!route;
        return (
          <TouchableOpacity
            onPress={hasRoute ? peekFullRoute : undefined}
            activeOpacity={hasRoute ? 0.8 : 1}
            disabled={!hasRoute}
            className="absolute bottom-2 left-3 px-3 py-2 rounded-lg max-w-[65%]"
            style={[
              { backgroundColor: COLORS.background, zIndex: 30 },
              SHADOWS.card,
            ]}
          >
            <View className="flex-row items-center">
              <View style={{ flexShrink: 1 }}>
                <Text
                  className="font-serif-semi text-[12px]"
                  style={{ color: hasRoute ? CMU_RED : COLORS.textSecondary }}
                  numberOfLines={1}
                >
                  {hasRoute ? `Route: ${route!.name}` : 'No route selected'}
                </Text>
                <Text
                  className="font-sans text-[10px] mt-[1px]"
                  style={{ color: COLORS.textSecondary }}
                  numberOfLines={1}
                >
                  {hasRoute
                    ? nextStopBuilding
                      ? `Next: ${nextStopBuilding.title}`
                      : 'Route complete'
                    : 'Tap Routes to select a route'}
                </Text>
              </View>
              {hasRoute && (
                <Ionicons
                  name="eye-outline"
                  size={14}
                  color={COLORS.textSecondary}
                  style={{ marginLeft: 10 }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })()}

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
