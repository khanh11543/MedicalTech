import React, { useCallback, useMemo, useState } from 'react';
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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { formatConsultationFee } from '@/lib/doctorPresentation';
import { ApiError } from '@/services/apiClient';
import { fetchPatientPrescription, type PrescriptionDto } from '@/services/patientPortalApi';

function formatDateLabel(iso: string | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso.split('T')[0] || iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function itemTitle(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!isObject(item)) return 'Medication';
  const candidates = [
    item.medicineName,
    item.drugName,
    item.name,
    item.medicationName,
    item.itemName,
  ].filter((v) => typeof v === 'string' && v.trim());
  return (candidates[0] as string | undefined) ?? 'Medication';
}

function itemSubtitle(item: unknown): string {
  if (!isObject(item)) return '';
  const parts: string[] = [];
  const dosage = typeof item.dosage === 'string' ? item.dosage : null;
  const strength = typeof item.strength === 'string' ? item.strength : null;
  const frequency = typeof item.frequency === 'string' ? item.frequency : null;
  const route = typeof item.route === 'string' ? item.route : null;
  const duration = typeof item.duration === 'string' ? item.duration : null;
  const instructions = typeof item.instructions === 'string' ? item.instructions : null;

  if (strength) parts.push(strength);
  if (dosage) parts.push(dosage);
  if (frequency) parts.push(frequency);
  if (route) parts.push(route);
  if (duration) parts.push(duration);
  if (!parts.length && instructions) parts.push(instructions);
  return parts.join(' · ');
}

function itemRightBadge(item: unknown): string | null {
  if (!isObject(item)) return null;
  const qty =
    typeof item.quantity === 'number'
      ? item.quantity
      : typeof item.qty === 'number'
        ? item.qty
        : typeof item.amount === 'number'
          ? item.amount
          : null;
  if (qty == null) return null;
  return `x${qty}`;
}

function badgeColors(kind: 'status' | 'payment' | 'neutral', text: string): { bg: string; fg: string } {
  const t = (text || '').toUpperCase();
  if (kind === 'payment') {
    if (t.includes('PAID')) return { bg: '#dcfce7', fg: '#166534' };
    if (t.includes('UNPAID') || t.includes('PENDING')) return { bg: '#ffedd5', fg: '#9a3412' };
    if (t.includes('FAILED')) return { bg: '#fee2e2', fg: '#991b1b' };
  }
  if (kind === 'status') {
    if (t.includes('COMPLETED') || t.includes('DONE')) return { bg: '#e0f2fe', fg: '#075985' };
    if (t.includes('CANCEL')) return { bg: '#fee2e2', fg: '#991b1b' };
  }
  return kind === 'neutral' ? { bg: '#e8eef5', fg: '#1a1a2e' } : { bg: '#e8eef5', fg: '#1a1a2e' };
}

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId?: string }>();
  const id = prescriptionId ? parseInt(prescriptionId, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rx, setRx] = useState<PrescriptionDto | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (!Number.isFinite(id)) {
      setError('Invalid prescription');
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchPatientPrescription(id);
      setRx(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load prescription');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const doctorLine = useMemo(() => {
    if (!rx) return '—';
    const n = rx.doctorName?.trim() || 'Doctor';
    const spec = rx.doctorSpecialization?.trim();
    return spec ? `${n} · ${spec}` : n;
  }, [rx]);

  const items = useMemo(() => (Array.isArray(rx?.items) ? rx?.items : []), [rx]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      {/* Removed bottom tint overlay (was causing pink haze). */}

      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={20} color="#1a1a2e" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading prescription…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={40} color="#c0392b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)} activeOpacity={0.85}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : rx ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIcon}>
                  <Ionicons name="document-text-outline" size={18} color="#5b9bd5" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.code} numberOfLines={1}>
                    {rx.prescriptionCode ?? `Prescription #${rx.id}`}
                  </Text>
                  <Text style={styles.doctorLine} numberOfLines={1}>
                    {doctorLine}
                  </Text>
                </View>
              </View>

              <View style={styles.badgesRow}>
                {rx.status ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeColors('status', rx.status).bg },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: badgeColors('status', rx.status).fg }]}>{rx.status}</Text>
                  </View>
                ) : null}
                {rx.prescriptionPaymentStatus ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeColors('payment', rx.prescriptionPaymentStatus).bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: badgeColors('payment', rx.prescriptionPaymentStatus).fg },
                      ]}
                    >
                      {rx.prescriptionPaymentStatus}
                    </Text>
                  </View>
                ) : null}
                {rx.prescriptionDate ? (
                  <View style={[styles.badge, { backgroundColor: badgeColors('neutral', 'date').bg }]}>
                    <Text style={[styles.badgeText, { color: badgeColors('neutral', 'date').fg }]}>
                      {formatDateLabel(rx.prescriptionDate)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#5b9bd5" />
                  <Text style={styles.infoLabel}>Doctor</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {rx.doctorName ?? '—'}
                  </Text>
                </View>
                {rx.diagnosis ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="clipboard-outline" size={16} color="#5b9bd5" />
                    <Text style={styles.infoLabel}>Diagnosis</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {rx.diagnosis}
                    </Text>
                  </View>
                ) : null}
                {rx.notes ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#5b9bd5" />
                    <Text style={styles.infoLabel}>Notes</Text>
                    <Text style={styles.infoValue} numberOfLines={3}>
                      {rx.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>Medications</Text>
                <Text style={styles.sectionMeta}>{items.length ? `${items.length} item(s)` : '—'}</Text>
              </View>
              {items.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="medkit-outline" size={28} color="#c0c8d4" />
                  <Text style={styles.emptyTitle}>No items</Text>
                  <Text style={styles.emptySub}>This prescription has no medication items attached.</Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {items.map((it, idx) => {
                    const title = itemTitle(it);
                    const sub = itemSubtitle(it);
                    const right = itemRightBadge(it);
                    return (
                      <View key={idx} style={styles.itemCard}>
                        <View style={styles.itemLeftIcon}>
                          <Ionicons name="bandage-outline" size={18} color="#5b9bd5" />
                        </View>
                        <View style={styles.itemBody}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          {sub ? (
                            <Text style={styles.itemSub} numberOfLines={2}>
                              {sub}
                            </Text>
                          ) : (
                            <Text style={styles.itemSubMuted} numberOfLines={1}>
                              Tap to view details in web/portal if needed
                            </Text>
                          )}
                        </View>
                        {right ? (
                          <View style={styles.qtyBadge}>
                            <Text style={styles.qtyText}>{right}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {rx.totalCost != null ? formatConsultationFee(rx.totalCost) : '—'}
                  </Text>
                </View>
                {rx.prescriptionPaymentStatus ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Status</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: badgeColors('payment', rx.prescriptionPaymentStatus).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: badgeColors('payment', rx.prescriptionPaymentStatus).fg },
                        ]}
                      >
                        {rx.prescriptionPaymentStatus}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  flex: { flex: 1 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffffcc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { marginTop: 10, fontSize: 14, color: '#8a8a9e' },
  errorText: { color: '#c0392b', textAlign: 'center', marginTop: 10, marginBottom: 14, fontSize: 14 },
  retryBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  doctorLine: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  section: { marginTop: 16 },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  sectionMeta: { fontSize: 12, color: '#8a8a9e', fontWeight: '600' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  infoLabel: { width: 78, color: '#8a8a9e', fontSize: 12, fontWeight: '800', paddingTop: 1 },
  infoValue: { flex: 1, color: '#1a1a2e', fontSize: 13, fontWeight: '600', lineHeight: 18 },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  emptySub: { marginTop: 6, fontSize: 13, color: '#8a8a9e', textAlign: 'center', lineHeight: 18 },

  itemsList: { gap: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 12,
    gap: 12,
  },
  itemLeftIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  itemSub: { marginTop: 3, fontSize: 12, color: '#6b7280', lineHeight: 16 },
  itemSubMuted: { marginTop: 3, fontSize: 12, color: '#9ca3af' },
  qtyBadge: { backgroundColor: '#e8eef5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  qtyText: { fontSize: 12, fontWeight: '800', color: '#1a1a2e' },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 12, color: '#8a8a9e', fontWeight: '800' },
  totalValue: { fontSize: 16, color: '#1a1a2e', fontWeight: '900' },
});
