import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';
import { fetchPublicDoctorsPage, type DoctorCardDto } from '@/services/dashboardApi';
import { doctorHoursLabel, formatConsultationFee, ratingNum } from '@/lib/doctorPresentation';

const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

export default function SpecialtyDoctorsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ specialtyId?: string; name?: string }>();
  const specialtyId = params.specialtyId ? Number(params.specialtyId) : NaN;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorCardDto[]>([]);

  const title = useMemo(() => params.name?.trim() || 'Doctors', [params.name]);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!Number.isFinite(specialtyId) || specialtyId <= 0) {
        setError('Invalid specialty.');
        setDoctors([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const list = await fetchPublicDoctorsPage({
          specialtyId,
          pageNumber: 0,
          pageSize: 50,
          sortBy: 'ratingAvg',
          sortOrder: 'desc',
        });
        setDoctors(list);
      } catch (e) {
        setDoctors([]);
        setError(e instanceof ApiError ? e.message : 'Could not load doctors');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [specialtyId]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const openDoctor = (d: DoctorCardDto) => {
    const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
    router.push({
      pathname: '/doctor-detail',
      params: {
        doctorId: String(d.id),
        specialtyId: String(specialtyId),
        name: d.fullName,
        specialty: d.primarySpecialty ?? d.specialties?.[0] ?? '',
        hours: doctorHoursLabel(d),
        price: formatConsultationFee(d.consultationFee),
        rating: String(ratingNum(d.ratingAvg)),
        image: img,
      },
    });
  };

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

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => load(false)} style={styles.retryBtn} activeOpacity={0.85}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#5b9bd5']} />}
          >
            {doctors.length === 0 ? (
              <Text style={styles.hint}>No doctors available for this specialty yet.</Text>
            ) : (
              <View style={styles.list}>
                {doctors.map((d) => {
                  const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
                  const r = ratingNum(d.ratingAvg);
                  return (
                    <TouchableOpacity key={d.id} style={styles.row} onPress={() => openDoctor(d)} activeOpacity={0.85}>
                      <Image source={{ uri: img }} style={styles.avatar} />
                      <View style={styles.body}>
                        <Text style={styles.name} numberOfLines={1}>
                          {d.fullName}
                        </Text>
                        <Text style={styles.spec} numberOfLines={1}>
                          {d.primarySpecialty ?? d.specialties?.[0] ?? ''}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          {doctorHoursLabel(d)} · {formatConsultationFee(d.consultationFee)}
                        </Text>
                      </View>
                      {r > 0 ? (
                        <View style={styles.rating}>
                          <FontAwesome name="star" size={11} color="#ff6b35" />
                          <Text style={styles.ratingText}>{r}</Text>
                        </View>
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={{ height: 24 }} />
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { marginTop: 10, fontSize: 14, color: '#8a8a9e', textAlign: 'center' },
  errorText: { color: '#c0392b', textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  content: { padding: 16, paddingBottom: 32 },
  list: { gap: 12 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#e8eef5' },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '900', color: '#1a1a2e' },
  spec: { marginTop: 2, fontSize: 12, color: '#5b9bd5', fontWeight: '700' },
  meta: { marginTop: 4, fontSize: 12, color: '#8a8a9e' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#1a1a2e' },
});

