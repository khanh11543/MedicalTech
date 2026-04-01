import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ApiError } from '@/services/apiClient';
import { fetchPatientMedicalRecords, type MedicalRecordDto } from '@/services/patientPortalApi';

function formatVisitDate(iso: string): string {
  try {
    const d = new Date(iso.split('T')[0] || iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function labResultsPreview(lab: unknown): string {
  if (lab == null) return '';
  if (typeof lab === 'string') return lab.slice(0, 200);
  try {
    return JSON.stringify(lab).slice(0, 280);
  } catch {
    return '';
  }
}

export default function MyTestsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecordDto[]>([]);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const page = await fetchPatientMedicalRecords({ pageNumber: 0, pageSize: 40 });
      setRecords(page.content ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load records');
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
      <StatusBar style="dark" />
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      <LinearGradient colors={['#f5dce8', '#ecc8d8']} style={styles.bottomGradient} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tests &amp; visits</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading medical records…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />
            }
          >
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            {records.length === 0 && !error ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={48} color="#c0c8d4" />
                <Text style={styles.emptyTitle}>No records yet</Text>
                <Text style={styles.emptySub}>Visit summaries and lab-related notes from your appointments appear here.</Text>
              </View>
            ) : null}

            {records.map((r) => {
              const lab = labResultsPreview(r.labResults);
              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconBox}>
                      <Ionicons name="pulse-outline" size={22} color="#5b9bd5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordCode}>{r.recordCode ?? `Record #${r.id}`}</Text>
                      <Text style={styles.visitDate}>{formatVisitDate(r.visitDate)}</Text>
                    </View>
                    {r.isConfidential ? (
                      <View style={styles.confidential}>
                        <Text style={styles.confidentialText}>Private</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.doctor}>
                    {r.doctorName ?? 'Doctor'}
                    {r.doctorSpecialization ? ` · ${r.doctorSpecialization}` : ''}
                  </Text>
                  {r.chiefComplaint ? (
                    <Text style={styles.sectionLabel}>Chief complaint</Text>
                  ) : null}
                  {r.chiefComplaint ? <Text style={styles.bodyText}>{r.chiefComplaint}</Text> : null}
                  {r.diagnosis ? <Text style={styles.sectionLabel}>Diagnosis</Text> : null}
                  {r.diagnosis ? <Text style={styles.bodyText}>{r.diagnosis}</Text> : null}
                  {lab ? <Text style={styles.sectionLabel}>Labs / results</Text> : null}
                  {lab ? <Text style={styles.labText}>{lab}{lab.length >= 280 ? '…' : ''}</Text> : null}
                  {r.treatmentPlan ? <Text style={styles.sectionLabel}>Treatment</Text> : null}
                  {r.treatmentPlan ? <Text style={styles.bodyText}>{r.treatmentPlan}</Text> : null}
                </View>
              );
            })}
            <View style={{ height: 24 }} />
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { marginTop: 10, fontSize: 14, color: '#8a8a9e' },
  errorBanner: {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  emptySub: { marginTop: 8, fontSize: 14, color: '#8a8a9e', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordCode: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  visitDate: { fontSize: 13, color: '#5b9bd5', marginTop: 2 },
  confidential: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidentialText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  doctor: { fontSize: 13, color: '#8a8a9e', marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', marginTop: 8, marginBottom: 4 },
  bodyText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  labText: { fontSize: 13, color: '#6b7280', fontFamily: 'monospace', lineHeight: 18 },
});
