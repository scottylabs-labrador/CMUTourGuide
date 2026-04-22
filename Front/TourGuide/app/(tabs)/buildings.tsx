import React from 'react';
import {
  View,
  Text,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../../contexts/BuildingContext';
import SummaryModal from '../../components/SummaryModal';
import BuildingCard from '../../components/BuildingCard';
import { getAllBuildingIds, getBuilding } from '../../services/buildingService';
import { getBuildingImageSource } from '../../constants/buildingImages';
import type { BuildingId } from '../../types/building';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const COLUMN_GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

export default function AllBuildingsScreen() {
  const {
    isUnlocked,
    isScannable,
    unlockedScannableCount,
    totalScannableCount,
  } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState('');

  const buildingIds = getAllBuildingIds();

  const handlePress = (buildingId: string) => {
    if (isUnlocked(buildingId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedBuildingId(buildingId);
      setShowSummaryPopup(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Building not unlocked', 'Find the building to unlock it!');
    }
  };

  const renderItem = ({ item: buildingId, index }: { item: BuildingId; index: number }) => {
    const building = getBuilding(buildingId);
    if (!building) return null;
    const unlocked = isUnlocked(buildingId);
    const scannable = isScannable(buildingId);
    const isLeftColumn = index % 2 === 0;

    return (
      <BuildingCard
        title={building.title}
        imageSource={getBuildingImageSource(buildingId, building.image_url)}
        unlocked={unlocked}
        scannable={scannable}
        onPress={() => handlePress(buildingId)}
        width={CARD_WIDTH}
        style={{ marginRight: isLeftColumn ? COLUMN_GAP : 0 }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top', 'left', 'right']}>
      <View
        className="items-center py-[14px] bg-white border-b border-border"
        style={{ paddingHorizontal: HORIZONTAL_PADDING }}
      >
        <Text className="font-serif-bold text-[20px] text-cmu-red">All Buildings</Text>
      </View>

      <View
        className="flex-row items-center justify-between py-3 bg-white border-b border-border"
        style={{ paddingHorizontal: HORIZONTAL_PADDING }}
      >
        <Text className="font-serif-semi text-sm text-[#1F2933]">Discovery Progress</Text>
        <Text className="font-serif-bold text-sm text-cmu-red">
          {unlockedScannableCount} / {totalScannableCount}
        </Text>
      </View>

      <FlatList
        data={buildingIds}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        columnWrapperStyle={{ marginBottom: COLUMN_GAP }}
        showsVerticalScrollIndicator={false}
      />

      <SummaryModal
        visible={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
        building_id={selectedBuildingId}
        isNewUnlock={false}
      />
    </SafeAreaView>
  );
}
