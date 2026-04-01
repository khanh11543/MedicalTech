import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { formatConsultationFee, ratingNum } from '@/lib/doctorPresentation';
import { ApiError } from '@/services/apiClient';
import { fetchDoctorDetailPublic } from '@/services/appointmentApi';
import { fetchPatientAppointments } from '@/services/patientPortalApi';
import type { AppointmentDto } from '@/services/dashboardApi';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

type DoctorRow = {
  doctorId: number;
  doctorName: string;
  specialty: string;
  lastAppointmentDate: string;
  image: string;
  feeLabel: string;
  rating: number;
};

function doctorTitle(name: string | undefined): string {
  const n = name?.trim();
  if (!n) return 'Doctor';
  if (/^dr\.?/i.test(n)) return n;
  return `Dr. ${n}`;
}

function aggregateFromAppointments(rows: AppointmentDto[]): Map<number, DoctorRow> {
  const map = new Map<number, DoctorRow>();
  for (const a of rows) {
    const id = a.doctorId;
    if (id == null) continue;
    const dateStr = a.appointmentDate?.split('T')[0] ?? '';
    const existing = map.get(id);
    if (!existing || dateStr > existing.lastAppointmentDate) {
      map.set(id, {
        doctorId: id,
        doctorName: doctorTitle(a.doctorName),
        specialty: a.doctorSpecialization?.trim() || 'Specialist',
        lastAppointmentDate: dateStr,
        image: PLACEHOLDER,
        feeLabel: formatConsultationFee(a.consultationFee),
        rating: 0,
      });
    }
  }
  return map;
}

export default function MyDoctorsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const page = await fetchPatientAppointments({ pageNumber: 0, pageSize: 100 });
      const content = page.content ?? [];
      const map = aggregateFromAppointments(content);
      let list = [...map.values()].sort((a, b) =>
        b.lastAppointmentDate.localeCompare(a.lastAppointmentDate)
      );

      const enriched = await Promise.all(
        list.map(async (d) => {
          try {
            const det = await fetchDoctorDetailPublic(d.doctorId);
            const uri = resolveBackendAbsoluteUrl(det.avatarUrl) ?? PLACEHOLDER;
            return {
              ...d,
              image: uri,
              feeLabel: formatConsultationFee(det.consultationFee ?? null),
              specialty: det.primarySpecialty?.trim() || d.specialty,
              rating: ratingNum(det.ratingAvg),
            };
          } catch {
            return d;
          }
        })
      );
      setDoctors(enriched);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      <LinearGradient colors={['#f5dce8', '#ecc8d8']} style={styles.bottomGradient} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Doctors</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />
            }
          >
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {doctors.length === 0 && !error ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color="#c0c8d4" />
                <Text style={styles.emptyTitle}>No doctors yet</Text>
                <Text style={styles.emptySub}>Doctors from your appointments will show up here.</Text>
              </View>
            ) : null}

            {doctors.map((doc) => (
              <TouchableOpacity
                key={doc.doctorId}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/doctor-detail',
                    params: {
                      doctorId: String(doc.doctorId),
                      name: doc.doctorName,
                      specialty: doc.specialty,
                      hours: doc.lastAppointmentDate ? `Last visit ${doc.lastAppointmentDate}` : '',
                      price: doc.feeLabel,
                      rating: String(doc.rating || 5),
                      image: doc.image,
                    },
                  })
                }
              >
                <View style={styles.avatarColumn}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: doc.image }} style={styles.avatar} />
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.ratingText}>{doc.rating > 0 ? doc.rating.toFixed(1) : '—'}</Text>
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <View style={styles.nameRow}>
                    <Text style={styles.doctorName} numberOfLines={2}>
                      {doc.doctorName}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                  </View>
                  <Text style={styles.specialty}>{doc.specialty}</Text>

                  <View style={styles.scheduleRow}>
                    <Ionicons name="calendar-outline" size={14} color="#5b9bd5" />
                    <Text style={styles.scheduleText} numberOfLines={1}>
                      {doc.lastAppointmentDate ? `Last: ${doc.lastAppointmentDate}` : 'From your care history'}
                    </Text>
                    <Text style={styles.price}>{doc.feeLabel}</Text>
                  </View>

                  <View style={styles.buttonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: '/make-appointment',
                          params: {
                            doctorId: String(doc.doctorId),
                            name: doc.doctorName,
                            specialty: doc.specialty,
                            image: doc.image,
                          },
                        })
                      }
                    >
                      <LinearGradient
                        colors={['#5b9bd5', '#4a8ec4']}
                        style={styles.appointmentBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.appointmentBtnText}>Book again</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { marginTop: 8, color: '#8a8a9e' },
  errorBanner: {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  emptySub: { marginTop: 8, fontSize: 14, color: '#8a8a9e', textAlign: 'center', paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  avatarColumn: { alignItems: 'center', marginRight: 14 },
  avatarWrapper: {
    width: 85,
    height: 85,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#d4e6f6',
    backgroundColor: '#e8eef5',
  },
  avatar: { width: '100%', height: '100%' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
    marginTop: -12,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  infoColumn: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  doctorName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1, marginRight: 8 },
  specialty: { fontSize: 13, color: '#8a8a9e', marginBottom: 6 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  scheduleText: { fontSize: 12, color: '#6b7280', flex: 1 },
  price: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', maxWidth: '40%' },
  buttonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appointmentBtn: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  appointmentBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
