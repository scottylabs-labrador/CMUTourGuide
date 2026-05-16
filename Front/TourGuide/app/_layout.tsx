import "../global.css";
import { Stack, usePathname, useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  SourceSerifPro_400Regular,
  SourceSerifPro_600SemiBold,
  SourceSerifPro_700Bold,
} from "@expo-google-fonts/source-serif-pro";
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans";
import React, { useState, useEffect, useRef } from "react";
import { PostHogProvider } from "posthog-react-native";
import { BuildingProvider, useBuildings } from "../contexts/BuildingContext";
import SummaryModal from "../components/SummaryModal";
import RouteCompletionModal from "../components/RouteCompletionModal";
import RoutePickerModal from "../components/RoutePickerModal";
import { getAllRoutes, getRoute } from "../services/routeService";
import { posthog } from "../config/posthog";

function GlobalSummaryModal() {
  const { pendingSummary, hideSummary } = useBuildings();
  return (
    <SummaryModal
      visible={pendingSummary !== null}
      onClose={hideSummary}
      building_id={pendingSummary?.buildingId ?? ''}
      isNewUnlock={pendingSummary?.isNewUnlock ?? false}
    />
  );
}

/**
 * Mounted globally so route completion can be detected and surfaced from
 * anywhere in the app (camera flow, map screen, etc.) — not just from the
 * tab that owns the route picker.
 *
 * Visibility rule: route is active, every stop unlocked, no building-summary
 * is currently on screen, and the user hasn't dismissed it for this
 * activeRouteId yet. The "no summary on screen" gate is what makes the popup
 * wait until the user finishes reading about the final building before it
 * appears.
 */
function GlobalRouteCompletionModal() {
  const {
    activeRouteId,
    setActiveRouteId,
    isActiveRouteComplete,
    routeCompletionDismissed,
    dismissRouteCompletion,
    pendingSummary,
  } = useBuildings();
  const [showPicker, setShowPicker] = useState(false);

  const route = activeRouteId ? getRoute(activeRouteId) : null;
  const shouldShow =
    !!route &&
    isActiveRouteComplete &&
    !routeCompletionDismissed &&
    pendingSummary === null &&
    !showPicker;

  const handleExploreNewRoute = () => {
    dismissRouteCompletion();
    setActiveRouteId(null);
    setShowPicker(true);
  };

  return (
    <>
      <RouteCompletionModal
        visible={shouldShow}
        routeName={route?.name ?? ''}
        stopCount={route?.stops.length ?? 0}
        onExploreNewRoute={handleExploreNewRoute}
        onDismiss={dismissRouteCompletion}
      />
      <RoutePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        routes={getAllRoutes()}
        activeRouteId={activeRouteId}
        onSelect={setActiveRouteId}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSerifPro_400Regular,
    SourceSerifPro_600SemiBold,
    SourceSerifPro_700Bold,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false,
          captureTouches: true,
          propsToCapture: ['testID'],
          maxElementsCaptured: 20,
        }}
      >
        <BuildingProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="camera" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="map" options={{ headerShown: false }} />
            <Stack.Screen name="blog" options={{ headerShown: false }} />
            <Stack.Screen name="info" options={{ headerShown: false }} />
          </Stack>
          <GlobalSummaryModal />
          <GlobalRouteCompletionModal />
        </BuildingProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
