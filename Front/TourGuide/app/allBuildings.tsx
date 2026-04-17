import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import SummaryModal from '../components/SummaryModal';
import BuildingCard from '../components/BuildingCard';
import { getAllBuildingIds, getBuilding } from '../services/buildingService';
import type { BuildingId } from '../types/building';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const COLUMN_GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

export default function AllBuildingsScreen() {
  const router = useRouter();
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
        imageUrl={building.image_url}
        unlocked={unlocked}
        scannable={scannable}
        onPress={() => handlePress(buildingId)}
        width={CARD_WIDTH}
        style={{ marginRight: isLeftColumn ? COLUMN_GAP : 0 }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={CMU_RED} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Buildings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.progressLabel}>Discovery Progress</Text>
        <Text style={styles.progressValue}>
          {unlockedScannableCount} / {totalScannableCount}
        </Text>
      </View>

      <FlatList
        data={buildingIds}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 6,
    width: 40,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: CMU_RED,
  },
  headerSpacer: {
    width: 40,
  },
  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  progressValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: CMU_RED,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    marginBottom: COLUMN_GAP,
  },
});
