import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Dimensions, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VolumeManager } from 'react-native-volume-manager';
import Slider from '@react-native-community/slider';
import { useBuildings } from '../contexts/BuildingContext';
import { scanBuilding } from '../services/visionService';
import { CMU_RED } from '../constants/colors';
import { usePostHog } from 'posthog-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// expo-camera zoom is 0..1. We expose 1x..10x to the user and map it
// to a non-linear curve so most of the slider is usable on real devices,
// where the underlying lens hits its native max well before zoom=1.
const MIN_ZOOM_X = 1;
const MAX_ZOOM_X = 10;
const ZOOM_CURVE = 2; // higher = more low-zoom resolution
const xToZoom = (x: number) =>
  Math.pow((x - MIN_ZOOM_X) / (MAX_ZOOM_X - MIN_ZOOM_X), ZOOM_CURVE);
const zoomToX = (z: number) =>
  MIN_ZOOM_X +
  (MAX_ZOOM_X - MIN_ZOOM_X) *
    Math.pow(Math.max(0, Math.min(1, z)), 1 / ZOOM_CURVE);

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [zoom, setZoom] = useState(0);
  const router = useRouter();
  const camera = useRef<CameraView>(null);
  const { unlockBuilding, isUnlocked, showSummary } = useBuildings();
  const posthog = usePostHog();

  // Keep the latest takePicture callback reachable from the volume listener.
  const takePictureRef = useRef<() => void>(() => {});

  // Volume buttons act as a hardware shutter. Requires the dev client build
  // because react-native-volume-manager is a native module. Declared before
  // any early returns so the hook order stays stable.
  useFocusEffect(
    useCallback(() => {
      if (!permission?.granted) return;

      let cancelled = false;
      let initialVolume: number | null = null;
      let ignoreNextEvent = false;
      let lastShotAt = 0;
      let subscription: { remove: () => void } | null = null;

      VolumeManager.showNativeVolumeUI({ enabled: false }).catch(() => {});
      VolumeManager.getVolume()
        .then((r) => {
          if (!cancelled) initialVolume = r.volume;
        })
        .catch(() => {});

      subscription = VolumeManager.addVolumeListener(({ volume }) => {
        if (ignoreNextEvent) {
          ignoreNextEvent = false;
          return;
        }
        const now = Date.now();
        if (now - lastShotAt < 600) return;
        lastShotAt = now;

        takePictureRef.current?.();

        // Bring the volume back to where it started so subsequent presses
        // keep firing instead of saturating at 0 or 1.
        if (initialVolume !== null && Math.abs(volume - initialVolume) > 0.001) {
          ignoreNextEvent = true;
          VolumeManager.setVolume(initialVolume, { showUI: false }).catch(() => {
            ignoreNextEvent = false;
          });
        }
      });

      return () => {
        cancelled = true;
        subscription?.remove();
        VolumeManager.showNativeVolumeUI({ enabled: true }).catch(() => {});
      };
    }, [permission?.granted])
  );

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="camera-outline" size={80} color={CMU_RED} />
          <Text className="font-serif-bold text-[24px] text-cmu-red mt-6 mb-4">
            Camera Permission Required
          </Text>
          <Text className="font-serif text-[16px] text-[#666] text-center mb-8" style={{ lineHeight: 22 }}>
            We need access to your camera to scan campus buildings and landmarks.
          </Text>
          <TouchableOpacity className="bg-cmu-red px-8 py-4 rounded-[25px]" onPress={requestPermission}>
            <Text className="font-serif-semi text-white text-[16px]">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const photo = await camera.current?.takePictureAsync({
        base64: true,
        quality: 1.0,
      });

      const identifiedBuildingId = await scanBuilding(photo?.base64 ?? '');
      if (!identifiedBuildingId || identifiedBuildingId === 'Error') {
        posthog.capture('building_scan_failed', { reason: 'unrecognised' });
        Alert.alert('Scan Failed', 'Could not identify the building. Please try again.');
        return;
      }

      const wasUnlocked = isUnlocked(identifiedBuildingId);
      await unlockBuilding(identifiedBuildingId);
      if (!wasUnlocked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      posthog.capture('building_scanned', {
        building_id: identifiedBuildingId,
        is_new_unlock: !wasUnlocked,
      });

      // Hand the result off to the global modal, then leave the camera screen
      // so the live preview unmounts and releases the camera + native shutter.
      showSummary(identifiedBuildingId, !wasUnlocked);
      router.back();
    } catch (error) {
      posthog.capture('building_scan_failed', {
        reason: 'error',
        $exception_type: error instanceof Error ? error.name : 'Unknown',
        $exception_message: error instanceof Error ? error.message : String(error),
      });
      Alert.alert('Scan Failed', 'Could not identify the building. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  takePictureRef.current = takePicture;

  const currentX = zoomToX(zoom);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row justify-between items-center px-5 py-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="font-serif-semi text-white text-lg">Scan Building</Text>
        <TouchableOpacity className="p-2" onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 relative">
        <CameraView
          style={{ flex: 1 }}
          ref={camera}
          facing={facing}
          zoom={zoom}
        />
        {isCapturing && (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-[1]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }} />
        )}
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-[2]" style={{ pointerEvents: 'box-none' }}>
          <View className="relative" style={{ width: SCREEN_WIDTH * 0.90, height: SCREEN_WIDTH * 0.90 }}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View className="absolute bottom-[30px] left-5 right-5">
            {isCapturing && (
              <View className="flex-row items-center justify-center py-3 px-5 rounded-[20px]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <Text className="text-white text-[16px] text-center">
                  Processing image...
                </Text>
                <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />
              </View>
            )}
       
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} className="pt-3 pb-[30px] px-6">
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Text style={styles.zoomEdgeLabel}>{`${MIN_ZOOM_X}x`}</Text>
          <Slider
            style={{ flex: 1, height: 36 }}
            minimumValue={MIN_ZOOM_X}
            maximumValue={MAX_ZOOM_X}
            value={currentX}
            onValueChange={(x) => {
              const clamped = Math.max(MIN_ZOOM_X, Math.min(MAX_ZOOM_X, x));
              setZoom(xToZoom(clamped));
            }}
            minimumTrackTintColor={CMU_RED}
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor={CMU_RED}
          />
          <Text style={styles.zoomEdgeLabel}>{`${MAX_ZOOM_X}x`}</Text>
        </View>
        <Text style={styles.zoomReadout}>
          {currentX < 10 ? currentX.toFixed(1) : '10'}x
        </Text>

        <View className="items-center mt-3">
          <TouchableOpacity
            className="w-20 h-20 rounded-full justify-center items-center"
            style={{
              backgroundColor: isCapturing ? '#666' : CMU_RED,
              shadowColor: CMU_RED,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <Ionicons name="camera" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: CMU_RED,
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  zoomEdgeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    width: 28,
    textAlign: 'center',
  },
  zoomReadout: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});
