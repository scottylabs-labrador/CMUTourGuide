import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS, RADIUS } from '../constants/layout';

type Props = {
  title: string;
  imageUrl: string;
  unlocked: boolean;
  scannable: boolean;
  onPress: () => void;
  width?: number;
  style?: object;
};

export default function BuildingCard({ title, imageUrl, unlocked, scannable, onPress, width = 210, style }: Props) {
  const badgeText = unlocked ? 'Unlocked' : scannable ? 'Must-See' : 'Explore';

  return (
    <TouchableOpacity
      style={[styles.card, { width }, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business-outline" size={32} color={COLORS.textMuted} />
          </View>
        )}
        {!unlocked && scannable && (
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
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.subtext}>
          {scannable ? 'Scan to reveal fun facts.' : 'Explore this building.'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: COLORS.border,
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
    backgroundColor: COLORS.border,
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
  },
  lockedText: {
    fontFamily: FONTS.regular,
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
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: CMU_RED,
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
