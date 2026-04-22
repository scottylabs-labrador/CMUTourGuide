import "../global.css";
import { Stack } from "expo-router";
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
import { BuildingProvider, useBuildings } from "../contexts/BuildingContext";
import SummaryModal from "../components/SummaryModal";

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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSerifPro_400Regular,
    SourceSerifPro_600SemiBold,
    SourceSerifPro_700Bold,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
      </BuildingProvider>
    </GestureHandlerRootView>
  );
}
