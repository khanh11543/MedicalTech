import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const RATINGS = [1.0, 2.0, 3.0, 4.0, 5.0];
const TIME_SLOTS = [
  '10 am – 12 pm',
  '12 am – 4 pm',
  '4 am – 7 pm',
  '7 am – 9 pm',
];

export default function FiltersScreen() {
  const router = useRouter();
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [selectedRating, setSelectedRating] = useState(5.0);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleApply = () => {
    // TODO: apply filters and navigate back
    router.back();
  };

  const handleReset = () => {
    setGender('Female');
    setSelectedRating(5.0);
    setSelectedSlots([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top gradient */}
      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.flex}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Gender ── */}
          <Text style={styles.sectionLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {(['Male', 'Female'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                activeOpacity={0.8}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Rating ── */}
          <Text style={styles.sectionLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            {RATINGS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setSelectedRating(r)}
                style={[styles.ratingChip, selectedRating === r && styles.ratingChipActive]}
              >
                <FontAwesome name="star" size={12} color="#ff6b35" />
                <Text style={[styles.ratingValue, selectedRating === r && styles.ratingValueActive]}>
                  {r.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Available Date ── */}
          <Text style={styles.sectionLabel}>Available Date</Text>
          <TouchableOpacity style={styles.dateBox}>
            <Text style={styles.dateText}>08 May 2025 – 29 May 2025</Text>
            <Ionicons name="calendar-outline" size={20} color="#8a8a9e" />
          </TouchableOpacity>

          {/* ── Available Hours ── */}
          <Text style={styles.sectionLabel}>Available Hours</Text>
          <View style={styles.hoursCard}>
            {TIME_SLOTS.map((slot) => {
              const selected = selectedSlots.includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  style={styles.hourRow}
                  onPress={() => toggleSlot(slot)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.hourText}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Bottom Buttons ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleApply} activeOpacity={0.85} style={styles.btnWrapper}>
            <LinearGradient
              colors={['#5b9bd5', '#7ab8e0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.85} style={styles.btnWrapper}>
            <View style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  /* ── Section ── */
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 22,
    marginBottom: 12,
  },

  /* ── Gender ── */
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderChip: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f0f4f8',
  },
  genderChipActive: {
    backgroundColor: '#5b9bd5',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  genderTextActive: {
    color: '#fff',
  },

  /* ── Rating ── */
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
  },
  ratingChipActive: {
    backgroundColor: '#5b9bd5',
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  ratingValueActive: {
    color: '#fff',
  },

  /* ── Date ── */
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  dateText: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '500',
  },

  /* ── Hours ── */
  hoursCard: {
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8eef5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#c0c8d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#5b9bd5',
    borderColor: '#5b9bd5',
  },
  hourText: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '500',
  },

  /* ── Bottom Buttons ── */
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 14,
  },
  btnWrapper: {
    flex: 1,
  },
  applyBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
