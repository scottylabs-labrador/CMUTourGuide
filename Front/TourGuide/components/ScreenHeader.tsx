import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS } from '../constants/layout';

type RightAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

type Props = {
  title: string;
  onBack: () => void;
  rightAction?: RightAction;
};

export default function ScreenHeader({ title, onBack, rightAction }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightAction ? (
        <TouchableOpacity
          style={styles.button}
          onPress={rightAction.onPress}
          disabled={rightAction.disabled}
        >
          <Ionicons
            name={rightAction.icon}
            size={24}
            color={rightAction.color ?? (rightAction.disabled ? 'rgba(255,255,255,0.3)' : COLORS.white)}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CMU_RED,
    ...SHADOWS.header,
  },
  button: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    fontSize: 18,
  },
  placeholder: {
    width: 40,
  },
});
