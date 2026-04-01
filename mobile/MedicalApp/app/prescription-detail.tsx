import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { formatConsultationFee } from '@/lib/doctorPresentation';
import { ApiError } from '@/services/apiClient';
import { fetchPatientPrescription, type PrescriptionDto } from '@/services/patientPortalApi';

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId?: string }>();
  const id = prescriptionId ? parseInt(prescriptionId, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rx, setRx] = useState<PrescriptionDto | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Invalid prescription');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatientPrescription(id);
      setRx(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load prescription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      <LinearGradient colors={['#f5dce8', '#ecc8d8']} style={styles.bottomGradient} />

      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : rx ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.code}>{rx.prescriptionCode ?? `#${rx.id}`}</Text>
            <Text style={styles.status}>
              {rx.status ?? '—'}
              {rx.prescriptionPaymentStatus ? ` · ${rx.prescriptionPaymentStatus}` : ''}
            </Text>
            <Text style={styles.label}>Doctor</Text>
            <Text style={styles.value}>
              {rx.doctorName ?? '—'}
              {rx.doctorSpecialization ? ` · ${rx.doctorSpecialization}` : ''}
            </Text>
            {rx.prescriptionDate ? (
              <>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{rx.prescriptionDate}</Text>
              </>
            ) : null}
            {rx.diagnosis ? (
              <>
                <Text style={styles.label}>Diagnosis</Text>
                <Text style={styles.value}>{rx.diagnosis}</Text>
              </>
            ) : null}
            {rx.notes ? (
              <>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.value}>{rx.notes}</Text>
              </>
            ) : null}
            {rx.totalCost != null ? (
              <>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.value}>{formatConsultationFee(rx.totalCost)}</Text>
              </>
            ) : null}
            {rx.items && rx.items.length > 0 ? (
              <>
                <Text style={styles.label}>Items</Text>
                <Text style={styles.mono}>{JSON.stringify(rx.items, null, 2)}</Text>
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  flex: { flex: 1 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#c0392b', textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  code: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  status: { fontSize: 14, color: '#5b9bd5', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#8a8a9e', marginTop: 12 },
  value: { fontSize: 15, color: '#1a1a2e', marginTop: 4, lineHeight: 22 },
  mono: { fontSize: 12, color: '#4b5563', marginTop: 4, fontFamily: 'monospace' },
});
