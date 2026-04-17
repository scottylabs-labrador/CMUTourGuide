import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SummaryModal from '../components/SummaryModal';
import { useBuildings } from '../contexts/BuildingContext';
import { canonicalBuildingId } from '../config/buildingIdMap';
import { scanBuilding } from '../services/visionService';
import { CMU_RED } from '../constants/colors';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)
  const [buildingId, setBuildingId] = useState("")
  const [isNewUnlock, setIsNewUnlock] = useState(false)
  const router = useRouter();
  const camera = useRef<CameraView>(null);
  const { unlockBuilding, isUnlocked } = useBuildings();

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
        quality: 1.0
      });

      const identifiedBuildingId = await scanBuilding(photo?.base64 ?? '');
      setBuildingId(identifiedBuildingId);

      // Check if building is already unlocked
      const wasUnlocked = isUnlocked(identifiedBuildingId);

      // Unlock the building
      if (identifiedBuildingId) {
        await unlockBuilding(identifiedBuildingId);

        // If it was a new unlock, provide celebration feedback
        if (!wasUnlocked) {
          setIsNewUnlock(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      setShowSummaryPopup(true);
    } catch (error) {
      Alert.alert(
        "Scan Failed",
        "Could not identify the building. Please try again.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row justify-between items-center px-5 py-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <TouchableOpacity
          className="p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="font-serif-semi text-white text-lg">Scan Building</Text>
        <TouchableOpacity
          className="p-2"
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 relative">
        {!showSummaryPopup && (
          <CameraView
            style={{ flex: 1 }}
            ref={camera}
            facing={facing}
          />
        )}
        {/* Dimming overlay when photo is taken */}
        {(isCapturing || showSummaryPopup) && (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-[1]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }} />
        )}
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-[2]" style={{ pointerEvents: 'box-none' }}>
          {/* Scanning frame */}
          <View className="relative" style={{ width: SCREEN_WIDTH * 0.90, height: SCREEN_WIDTH * 0.90 }}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Instructions */}
          <View className="absolute bottom-[30px] left-5 right-5">
            <View className="flex-row items-center justify-center py-3 px-5 rounded-[20px]" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <Text className="text-white text-[16px] text-center">
                {isCapturing ? 'Processing image...' : 'Point your camera at a building or landmark'}
              </Text>
              {isCapturing && (
                <ActivityIndicator
                  size="small"
                  color="white"
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <View className="py-[30px]" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        <View className="items-center">
          <TouchableOpacity
            className="w-20 h-20 rounded-full justify-center items-center"
            style={[
              {
                backgroundColor: isCapturing ? '#666' : CMU_RED,
                shadowColor: CMU_RED,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <Ionicons name="camera" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <SummaryModal
        visible={showSummaryPopup}
        onClose={() => {
          setShowSummaryPopup(false);
          setIsNewUnlock(false);
        }}
        building_id={buildingId}
        isNewUnlock={isNewUnlock}
      />
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
});
