import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const handlePastChats = () => {
    // Dummy function - no functionality yet
  };

  const handleMapView = () => {
    // Dummy function - no functionality yet
  };

  const handleScan = () => {
    router.push('/camera');
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

        {/* Map Preview Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={64} color="#ddd" />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
          </View>
        </View>
      </ScrollView>
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
});
