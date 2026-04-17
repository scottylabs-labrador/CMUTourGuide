import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';

type BuildingId = keyof typeof buildings;

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

  const buildingIds = Object.keys(buildings) as BuildingId[];

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
    const building = buildings[buildingId];
    const unlocked = isUnlocked(buildingId);
    const scannable = isScannable(buildingId);
    const showLockedOverlay = scannable && !unlocked;
    const isLeftColumn = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { marginRight: isLeftColumn ? COLUMN_GAP : 0 },
        ]}
        onPress={() => handlePress(buildingId)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {building.image_url ? (
            <Image
              source={{ uri: building.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="business-outline" size={32} color="#999" />
            </View>
          )}
          {showLockedOverlay && (
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.lockedText}>Scan to unlock</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent']}
            style={styles.gradientTop}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.gradientBottom}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {scannable ? (unlocked ? 'Unlocked' : 'Must‑See') : 'Explore'}
            </Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {building.title}
          </Text>
        </View>
      </TouchableOpacity>
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
          <Ionicons name="arrow-back" size={24} color="#C41E3A" />
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 6,
    width: 40,
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 20,
    color: '#C41E3A',
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressLabel: {
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 14,
    color: '#1F2933',
  },
  progressValue: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 14,
    color: '#C41E3A',
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    marginBottom: COLUMN_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#e9ecef',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  lockedText: {
    fontFamily: 'SourceSerifPro_400Regular',
    marginTop: 4,
    fontSize: 12,
    color: '#fff',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgeText: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 11,
    color: '#C41E3A',
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  name: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});
