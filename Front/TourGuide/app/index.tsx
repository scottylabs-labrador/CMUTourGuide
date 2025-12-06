import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBuildings } from '../contexts/BuildingContext';
import buildings from '../components/buildings.json';
import SummaryModal from '../components/SummaryModal';

export default function HomeScreen() {
  const router = useRouter();
  const { unlockedBuildings, isUnlocked } = useBuildings();
  const [showSummaryPopup, setShowSummaryPopup] = React.useState(false)
  const [buildingId, setBuildingId] = React.useState("")
  const buildingKeys = Object.keys(buildings);
  const totalBuildings = buildingKeys.length;
  const unlockedCount = unlockedBuildings.length;
  const progressPercentage = totalBuildings > 0 ? (unlockedCount / totalBuildings) * 100 : 0;

  const handlePastChats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/pastChats');
  };

  const handleMapView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/map');
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  };

  const handleBuildingPress = (buildingId: string) => {
    if (isUnlocked(buildingId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBuildingId(buildingId);
      setShowSummaryPopup(true)
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Building not unlocked", "Find the building to unlock it!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CMU Tour Guide</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => router.push('/info')}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color="#C41E3A" />
          </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleScan}
          activeOpacity={0.9}
        >
          <View style={styles.mainButtonIcon}>
            <Ionicons name="camera" size={48} color="#C41E3A" />
          </View>
          <Text style={styles.mainButtonText}>Scan</Text>
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Discovery Progress</Text>
            <Text style={styles.progressText}>{unlockedCount} / {totalBuildings}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Secondary Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handlePastChats}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#C41E3A" />
            <Text style={styles.actionButtonText}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleMapView}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={24} color="#C41E3A" />
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Buildings Grid */}
        <View style={styles.buildingsSection}>
          <Text style={styles.sectionTitle}>Buildings</Text>
          <View style={styles.buildingsGrid}>
            {buildingKeys.map((buildingId) => {
              const building = buildings[buildingId as keyof typeof buildings];
              const unlocked = isUnlocked(buildingId);
              
              return (
                <TouchableOpacity
                  key={buildingId}
                  style={[styles.buildingCard, !unlocked && styles.buildingCardLocked]}
                  onPress={() => handleBuildingPress(buildingId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buildingImageContainer}>
                    {building.image_url ? (
                      <Image
                        source={{ uri: building.image_url }}
                        style={[styles.buildingImage, !unlocked && styles.buildingImageLocked]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.buildingImagePlaceholder, !unlocked && styles.buildingImageLocked]}>
                        <Ionicons name="business-outline" size={32} color={unlocked ? "#C41E3A" : "#999"} />
                      </View>
                    )}
                    {!unlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.buildingName, !unlocked && styles.buildingNameLocked]} numberOfLines={2}>
                    {building.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <SummaryModal
        visible={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
        building_id={buildingId}
        isNewUnlock={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    marginTop: 12,
    position: 'relative',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#C41E3A',
    letterSpacing: -0.5,
  },
  mainButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#C41E3A',
    borderStyle: 'dashed',
  },
  mainButtonIcon: {
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C41E3A',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C41E3A',
    marginTop: 8,
  },
  mapContainer: {
    marginTop: 8,
  },
  mapPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  progressContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C41E3A',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  buildingsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  buildingCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  buildingCardLocked: {
    opacity: 0.6,
  },
  buildingImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#e9ecef',
  },
  buildingImage: {
    width: '100%',
    height: '100%',
  },
  buildingImageLocked: {
    opacity: 0.4,
  },
  buildingImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  buildingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 12,
    textAlign: 'center',
  },
  buildingNameLocked: {
    color: '#999',
  },
});
