import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BuildingProvider } from "../contexts/BuildingContext";

export default function RootLayout() {
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
