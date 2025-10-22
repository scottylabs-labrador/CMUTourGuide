import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const handleTestAPI = async () => {
    const response = await fetch('https://cmutourguide-backend-production.up.railway.app/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(await response.json());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CMU Tour Guide</Text>
          <Text style={styles.subtitle}>Discover Carnegie Mellon's Hidden Stories</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={80} color="#C41E3A" />
          </View>
          
          <Text style={styles.description}>
            Point your camera at any building, monument, or landmark on campus to learn its fascinating history and insider secrets.
          </Text>

          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.scanButtonText}>Scan a Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleTestAPI}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.scanButtonText}>Test API</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="eye" size={20} color="#C41E3A" />
            <Text style={styles.featureText}>Computer Vision</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="bulb" size={20} color="#C41E3A" />
            <Text style={styles.featureText}>AI Insights</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="map" size={20} color="#C41E3A" />
            <Text style={styles.featureText}>Campus Expert</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#C41E3A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  description: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  scanButton: {
    backgroundColor: '#C41E3A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#C41E3A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
});
