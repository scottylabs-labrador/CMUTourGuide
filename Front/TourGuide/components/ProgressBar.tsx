import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS, RADIUS } from '../constants/layout';

type Props = {
  current: number;
  total: number;
  label?: string;
  hint?: string;
};

export default function ProgressBar({ current, total, label = 'Discovery Progress', hint }: Props) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.count}>{current} / {total}</Text>
          {hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 20,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 10,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    textAlign: 'left',
    color: COLORS.textPrimary,
  },
  count: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: CMU_RED,
    marginTop: 2,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  barContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: CMU_RED,
    borderRadius: 4,
  },
});
