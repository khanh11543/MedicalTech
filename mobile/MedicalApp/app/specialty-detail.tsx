import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ApiError } from '@/services/apiClient';
import { fetchPublicSpecialties, type SpecialtyDto } from '@/services/dashboardApi';
import { pickSpecialtyIcon } from '@/lib/medicalIcons';

export default function SpecialtyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialtyId?: string; name?: string }>();
  const id = params.specialtyId ? Number(params.specialtyId) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<SpecialtyDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPublicSpecialties();
      const found = Number.isFinite(id) ? list.find((s) => s.id === id) : null;
      setSpecialty(found ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load specialty');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const title = useMemo(() => specialty?.name || params.name || 'Specialty', [specialty?.name, params.name]);
  const desc = useMemo(() => specialty?.description?.trim() || 'Learn about this specialty and find the right doctor.', [
    specialty?.description,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={pickSpecialtyIcon(title)} size={34} color="#5b9bd5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroDesc}>{desc}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={() =>
                router.push({
                  pathname: '/specialty-doctors',
                  params: Number.isFinite(id) ? { specialtyId: String(id), name: title } : { name: title },
                })
              }
            >
              <Text style={styles.primaryBtnText}>Book appointment</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', flex: 1, textAlign: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { marginTop: 10, fontSize: 14, color: '#8a8a9e' },
  errorText: { color: '#c0392b', textAlign: 'center' },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    flexDirection: 'row',
    gap: 14,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
  heroDesc: { marginTop: 6, fontSize: 13, color: '#6b7280', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#5b9bd5',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});

