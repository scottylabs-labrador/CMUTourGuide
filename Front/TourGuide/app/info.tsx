import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../contexts/BuildingContext';

export default function InfoScreen() {
  const router = useRouter();
  const { clearStorage } = useBuildings();

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Progress',
      'Are you sure you want to clear all unlocked buildings? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearStorage();
              Alert.alert('Success', 'All progress has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear storage. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#C41E3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>CMU Tour Guide</Text>
          <Text style={styles.subtitle}>Your Intelligent Campus Companion</Text>
        </View>

        {/* What is it */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#C41E3A" />
            <Text style={styles.sectionTitle}>What is it?</Text>
          </View>
          <Text style={styles.sectionText}>
            CMU Tour Guide is an AI-powered mobile application that uses computer vision and artificial intelligence to provide instant, detailed information about buildings, monuments, and landmarks across Carnegie Mellon University's campus.
          </Text>
        </View>

        {/* Who is it for */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#C41E3A" />
            <Text style={styles.sectionTitle}>Who is it for?</Text>
          </View>
          <Text style={styles.sectionText}>
            Perfect for prospective students, new visitors, current students exploring campus, alumni returning to campus, and anyone curious about the rich history and architecture of CMU.
          </Text>
        </View>

        {/* What it does */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color="#C41E3A" />
            <Text style={styles.sectionTitle}>What it does</Text>
          </View>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color="#C41E3A" />
              <Text style={styles.featureText}>Scan buildings and landmarks with your camera</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bulb" size={20} color="#C41E3A" />
              <Text style={styles.featureText}>Get instant AI-powered insights and history</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={20} color="#C41E3A" />
              <Text style={styles.featureText}>Save and review past conversations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={20} color="#C41E3A" />
              <Text style={styles.featureText}>Explore campus with interactive maps</Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color="#C41E3A" />
            <Text style={styles.sectionTitle}>How it works</Text>
          </View>
          <Text style={styles.sectionText}>
            Simply point your camera at any building or landmark on campus. Our advanced computer vision technology identifies the location, and our AI system provides you with fascinating stories, historical context, and insider information about that place.
          </Text>
        </View>

        {/* Clear Storage Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearStorage}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made for Carnegie Mellon University</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C41E3A',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#C41E3A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C41E3A',
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
