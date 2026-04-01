import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SideDrawer from '@/components/side-drawer';

const { width } = Dimensions.get('window');
const GRID_GAP = 14;
const GRID_PADDING = 20;
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

// ── Data ───────────────────────────────────────────────────
const categories = [
  { name: 'Dentistry', icon: 'tooth-outline' as const },
  { name: 'Gynecology', icon: 'human-female' as const },
  { name: 'Ophthalmology', icon: 'eye-outline' as const },
  { name: 'Neurology', icon: 'brain' as const },
  { name: 'Allergists', icon: 'clipboard-text-outline' as const },
  { name: 'Cardiology', icon: 'heart-pulse' as const },
];

const diagnostics = [
  { name: 'Genetic\nTesting', icon: 'dna' as const, dark: false },
  { name: 'Cellular and\nchemical', icon: 'flask-outline' as const, dark: true },
  { name: 'Diagnostic\nImaging', icon: 'stethoscope' as const, dark: true },
  { name: 'Magnetic\nResonance', icon: 'clipboard-pulse-outline' as const, dark: false },
];

export default function SearchScreen() {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setDrawerVisible(true)}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face' }}
                  style={styles.userAvatar}
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search</Text>
            <TouchableOpacity onPress={() => router.push('/filters')}>
              <Ionicons name="menu" size={26} color="#1a1a2e" />
            </TouchableOpacity>
          </View>

          {/* ── Categories Grid ── */}
          <Text style={styles.sectionTitle}>Categorys</Text>
          <View style={styles.grid}>
            {categories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.gridCard}>
                <View style={styles.gridIconWrapper}>
                  <MaterialCommunityIcons name={cat.icon} size={32} color="#5b9bd5" />
                </View>
                <Text style={styles.gridLabel}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Diagnostics & Tests ── */}
          <Text style={styles.sectionTitle}>Diagnostics & Tests</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.diagnosticsRow}
          >
            {diagnostics.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.diagnosticCard}>
                <View style={[styles.diagnosticIconBox, item.dark && styles.diagnosticIconDark]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={30}
                    color={item.dark ? '#fff' : '#5b9bd5'}
                  />
                </View>
                <Text style={styles.diagnosticName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#e0e8f0',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  /* ── Section ── */
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: GRID_PADDING,
    marginTop: 22,
    marginBottom: 14,
  },

  /* ── Categories Grid ── */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  gridIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },

  /* ── Diagnostics ── */
  diagnosticsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  diagnosticCard: {
    alignItems: 'center',
    width: 100,
  },
  diagnosticIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  diagnosticIconDark: {
    backgroundColor: '#1a1a2e',
  },
  diagnosticName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1a1a2e',
    textAlign: 'center',
    lineHeight: 15,
  },

  /* ── Bottom Gradient ── */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
