import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, SourceSerifPro_400Regular, SourceSerifPro_600SemiBold, SourceSerifPro_700Bold } from "@expo-google-fonts/source-serif-pro";
import { BuildingProvider } from "../contexts/BuildingContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSerifPro_400Regular,
    SourceSerifPro_600SemiBold,
    SourceSerifPro_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <BuildingProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
      </Stack>
    </BuildingProvider>
  );
}
