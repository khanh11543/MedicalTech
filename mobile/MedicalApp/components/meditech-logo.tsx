import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type MediTechLogoProps = {
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
};

const COLORS = {
  brand: '#049ebb',
  text: '#18444c',
  bg: '#f0f4f8',
};

export default function MediTechLogo({ style, size = 'md' }: MediTechLogoProps) {
  const s = size === 'sm' ? sizes.sm : sizes.md;

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.iconWrap, s.iconWrap]}>
        <MaterialCommunityIcons name="hospital-building" size={s.iconSize} color={COLORS.brand} />
        <View style={[styles.plusV, s.plusV]} />
        <View style={[styles.plusH, s.plusH]} />
      </View>
      <Text style={[styles.wordmark, s.wordmark]}>MediTech</Text>
    </View>
  );
}

const sizes = {
  sm: {
    iconWrap: { width: 28, height: 28, borderRadius: 10 },
    iconSize: 20,
    plusV: { height: 10, width: 3, borderRadius: 2 },
    plusH: { height: 3, width: 10, borderRadius: 2 },
    wordmark: { fontSize: 18 },
  },
  md: {
    iconWrap: { width: 32, height: 32, borderRadius: 12 },
    iconSize: 22,
    plusV: { height: 12, width: 3.5, borderRadius: 2.5 },
    plusH: { height: 3.5, width: 12, borderRadius: 2.5 },
    wordmark: { fontSize: 20 },
  },
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusV: {
    position: 'absolute',
    backgroundColor: COLORS.brand,
    opacity: 0.95,
  },
  plusH: {
    position: 'absolute',
    backgroundColor: COLORS.brand,
    opacity: 0.95,
  },
  wordmark: {
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
});

