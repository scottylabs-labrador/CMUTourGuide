import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../contexts/BuildingContext';
import { CMU_RED } from '../constants/colors';
import SummaryModal from '../components/SummaryModal';
import CampusMap from '../components/CampusMap';

export default function MapScreen() {
  const router = useRouter();
  const { unlockedScannableCount, totalScannableCount } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  const progressPercentage =
    totalScannableCount > 0 ? (unlockedScannableCount / totalScannableCount) * 100 : 0;

  const handleScan = () => {
    router.push('/camera');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-200">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CMU_RED} />
        </TouchableOpacity>
        <Text className="text-[20px] font-serif-bold text-cmu-red">Campus Map</Text>
        <View className="w-10" />
      </View>

      <View className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[14px] text-slate-800 font-serif-semi">Discovery Progress</Text>
          <Text className="text-[14px] font-serif-bold text-cmu-red">
            {unlockedScannableCount} / {totalScannableCount}
          </Text>
        </View>
        <View className="h-[6px] bg-slate-200 rounded-full overflow-hidden">
          <View
            className="h-full"
            style={{ width: `${progressPercentage}%`, backgroundColor: CMU_RED }}
          />
        </View>
      </View>

      <CampusMap
        style={{ flex: 1 }}
        onBuildingPress={(id) => {
          setSelectedBuildingId(id);
          setShowSummaryPopup(true);
        }}
      />

      <View className="px-5 py-3 border-t border-slate-200 bg-white">
        <TouchableOpacity
          className="rounded-xl py-3 px-5 flex-row items-center justify-center bg-cmu-red"
          onPress={handleScan}
          activeOpacity={0.9}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text className="ml-2 text-white text-[16px] font-serif-semi">Scan</Text>
        </TouchableOpacity>
      </View>

      <SummaryModal
        visible={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
        building_id={selectedBuildingId}
        isNewUnlock={false}
      />
    </SafeAreaView>
  );
}
