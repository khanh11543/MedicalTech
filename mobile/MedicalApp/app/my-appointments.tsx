import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { formatConsultationFee } from '@/lib/doctorPresentation';
import { ApiError } from '@/services/apiClient';
import type { AppointmentDto } from '@/services/dashboardApi';
import { fetchPatientAppointments, cancelPatientAppointment } from '@/services/patientPortalApi';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

const PAST = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

function isPastAppointment(a: AppointmentDto): boolean {
  return PAST.has((a.status || '').toUpperCase());
}

const HOUR_MS = 60 * 60 * 1000;

function timeToMsOnDate(
  y: number,
  mo: number,
  d: number,
  raw: string | undefined | null
): number | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const sec = parseInt(parts[2] ?? '0', 10);
  if (!Number.isFinite(h)) return null;
  const local = new Date(y, mo - 1, d, h, Number.isFinite(m) ? m : 0, Number.isFinite(sec) ? sec : 0, 0);
  const ms = local.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** End of the visit window: endTime if present, else start + 1h, else end of that calendar day. */
function appointmentEndMs(apt: AppointmentDto): number {
  const dateStr = apt.appointmentDate?.split('T')[0] ?? '';
  if (!dateStr) return 0;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return 0;

  const endDirect = timeToMsOnDate(y, mo, d, apt.endTime);
  if (endDirect != null) return endDirect;

  const startMs = timeToMsOnDate(y, mo, d, apt.startTime);
  if (startMs != null) return startMs + HOUR_MS;

  return new Date(y, mo - 1, d, 23, 59, 59, 999).getTime();
}

/** Visit window has ended — no pay/cancel; list under Past. */
function isAppointmentTimeExpired(apt: AppointmentDto): boolean {
  const end = appointmentEndMs(apt);
  return end > 0 && end < Date.now();
}

function doctorTitle(name: string | undefined): string {
  const n = name?.trim();
  if (!n) return 'Doctor';
  if (/^dr\.?/i.test(n)) return n;
  return `Dr. ${n}`;
}

function formatTimeLabel(t: string | undefined): string {
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length < 2) return t;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h)) return t;
  const d = new Date();
  d.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function splitDateBox(apt: AppointmentDto): { day: string; monthLine: string; timeLine: string } {
  const dateStr = apt.appointmentDate?.split('T')[0] ?? '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : null;
  const day = date ? String(date.getDate()).padStart(2, '0') : '—';
  const monthLine = date
    ? date.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', ' ')
    : '';
  const tl = formatTimeLabel(apt.startTime);
  const timeLine = tl ? `at ${tl}` : '';
  return { day, monthLine, timeLine };
}

function formatPastWhen(apt: AppointmentDto): string {
  const dateStr = apt.appointmentDate?.split('T')[0] ?? '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : null;
  const dayStr = date
    ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : dateStr;
  const tl = formatTimeLabel(apt.startTime);
  return tl ? `${dayStr} · ${tl}` : dayStr;
}

function statusDisplay(status: string | undefined): { label: string; color: string } {
  const s = (status || '').toUpperCase();
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: '#f59e0b' },
    SCHEDULED: { label: 'Scheduled', color: '#3b82f6' },
    CONFIRMED: { label: 'Confirmed', color: '#22c55e' },
    CHECKED_IN: { label: 'Checked in', color: '#0ea5e9' },
    IN_PROGRESS: { label: 'In progress', color: '#8b5cf6' },
    COMPLETED: { label: 'Completed', color: '#6b7280' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444' },
    NO_SHOW: { label: 'No-show', color: '#b45309' },
    RESCHEDULED: { label: 'Rescheduled', color: '#6366f1' },
  };
  return map[s] || { label: s.replace(/_/g, ' ') || '—', color: '#6b7280' };
}

function pastCardStatusLabel(apt: AppointmentDto): string {
  if (isAppointmentTimeExpired(apt) && !isPastAppointment(apt)) {
    return 'Expired';
  }
  return statusDisplay(apt.status).label;
}

function sortKey(apt: AppointmentDto): number {
  const d = apt.appointmentDate?.split('T')[0] ?? '';
  const t = (apt.startTime || '00:00:00').slice(0, 8);
  const ms = new Date(`${d}T${t.length === 5 ? `${t}:00` : t}`).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function canCancel(apt: AppointmentDto): boolean {
  if (isAppointmentTimeExpired(apt)) return false;
  const s = (apt.status || '').toUpperCase();
  return s === 'PENDING' || s === 'CONFIRMED' || s === 'SCHEDULED';
}

function showPayButton(apt: AppointmentDto): boolean {
  if (isAppointmentTimeExpired(apt)) return false;
  if (apt.paymentId == null) return false;
  const ps = (apt.paymentStatus || '').toUpperCase();
  return ps !== 'PAID';
}

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<AppointmentDto[]>([]);
  const [past, setPast] = useState<AppointmentDto[]>([]);
  const [selectedApt, setSelectedApt] = useState<AppointmentDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const page = await fetchPatientAppointments({ pageNumber: 0, pageSize: 100 });
      const all = page.content ?? [];
      const up = all
        .filter((a) => !isPastAppointment(a) && !isAppointmentTimeExpired(a))
        .sort((a, b) => sortKey(a) - sortKey(b));
      const pa = all
        .filter((a) => isPastAppointment(a) || isAppointmentTimeExpired(a))
        .sort((a, b) => sortKey(b) - sortKey(a));
      setUpcoming(up);
      setPast(pa);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Could not load appointments');
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

  const openCancelModal = (apt: AppointmentDto) => {
    setSelectedApt(apt);
    setCancelReason('');
  };

  const confirmCancel = async () => {
    if (!selectedApt) return;
    if (isAppointmentTimeExpired(selectedApt)) {
      Alert.alert(
        'Not available',
        'This appointment time has passed. Cancellation is no longer available in the app.',
      );
      setSelectedApt(null);
      await load(true);
      return;
    }
    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert('Required', 'Please enter a cancellation reason.');
      return;
    }
    setCancelling(true);
    try {
      await cancelPatientAppointment(selectedApt.id, reason);
      setSelectedApt(null);
      await load(true);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  const pushPayment = (apt: AppointmentDto) => {
    const { day, monthLine, timeLine } = splitDateBox(apt);
    router.push({
      pathname: '/payment',
      params: {
        appointmentId: String(apt.id),
        paymentId: apt.paymentId != null ? String(apt.paymentId) : '',
        doctorId: apt.doctorId != null ? String(apt.doctorId) : '',
        doctor: doctorTitle(apt.doctorName),
        specialty: apt.doctorSpecialization || '',
        date: `${day} ${monthLine}`.trim(),
        time: timeLine,
        image: PLACEHOLDER_AVATAR,
      },
    });
  };

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
          <Text style={styles.headerTitle}>My Appointments</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading appointments…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />
            }
          >
            {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}

            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {upcoming.length === 0 ? (
              <Text style={styles.emptyLine}>No upcoming appointments.</Text>
            ) : null}

            {upcoming.map((apt) => {
              const { day, monthLine, timeLine } = splitDateBox(apt);
              const st = statusDisplay(apt.status);
              return (
                <View key={apt.id} style={styles.upcomingCard}>
                  <View style={styles.upcomingRow}>
                    <LinearGradient colors={['#5b9bd5', '#7ab8e0']} style={styles.dateBox}>
                      <Text style={styles.dateDay}>{day}</Text>
                      <Text style={styles.dateMonth}>{monthLine}</Text>
                      <View style={styles.dateDivider} />
                      <Text style={styles.dateTime}>{timeLine}</Text>
                    </LinearGradient>
                    <View style={styles.upcomingAvatarWrapper}>
                      <Image source={{ uri: PLACEHOLDER_AVATAR }} style={styles.upcomingAvatar} />
                    </View>
                    <View style={styles.upcomingInfo}>
                      <View style={styles.upcomingNameRow}>
                        <Text style={styles.upcomingName} numberOfLines={2}>
                          {doctorTitle(apt.doctorName)}
                        </Text>
                        {apt.appointmentCode ? (
                          <Text style={styles.codeSmall}>{apt.appointmentCode}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.upcomingSpecialty}>{apt.doctorSpecialization || '—'}</Text>
                      <View style={styles.upcomingStatusRow}>
                        <View style={styles.statusBadge}>
                          <Ionicons name="ellipse" size={10} color={st.color} />
                          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.upcomingActions}>
                    {canCancel(apt) ? (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => openCancelModal(apt)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    {showPayButton(apt) ? (
                      <TouchableOpacity style={styles.payBtn} activeOpacity={0.8} onPress={() => pushPayment(apt)}>
                        <LinearGradient
                          colors={['#5b9bd5', '#4a8ec4']}
                          style={styles.payBtnGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Ionicons name="card-outline" size={16} color="#fff" />
                          <Text style={styles.payBtnText}>Payment</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Past Appointments</Text>
            {past.length === 0 ? (
              <Text style={styles.emptyLine}>No past appointments.</Text>
            ) : null}

            {past.map((apt) => (
              <View key={apt.id} style={styles.pastCard}>
                <View style={styles.pastRow}>
                  <View style={styles.pastAvatarWrapper}>
                    <Image source={{ uri: PLACEHOLDER_AVATAR }} style={styles.pastAvatar} />
                  </View>
                  <View style={styles.pastInfo}>
                    <View style={styles.pastNameRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pastName}>{doctorTitle(apt.doctorName)}</Text>
                        <Text style={styles.pastSpecialty}>{apt.doctorSpecialization || '—'}</Text>
                        <Text style={styles.pastStatusHint}>{pastCardStatusLabel(apt)}</Text>
                      </View>
                      <Text style={styles.pastPrice}>{formatConsultationFee(apt.consultationFee)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.pastFooter}>
                  <View style={styles.pastDateRow}>
                    <Ionicons name="time-outline" size={14} color="#5b9bd5" />
                    <Text style={styles.pastDateText}>{formatPastWhen(apt)}</Text>
                  </View>
                  <View style={styles.pastActions}>
                    {apt.status === 'COMPLETED' && !apt.hasReview ? (
                      <TouchableOpacity
                        style={styles.leaveReviewBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          router.push({
                            pathname: '/write-review',
                            params: {
                              doctor: doctorTitle(apt.doctorName),
                              specialty: apt.doctorSpecialization || '',
                              appointmentId: String(apt.id),
                              doctorId: apt.doctorId != null ? String(apt.doctorId) : '',
                            },
                          })
                        }
                      >
                        <LinearGradient
                          colors={['#5b9bd5', '#4a8ec4']}
                          style={styles.leaveReviewGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.leaveReviewText}>Rating</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : null}
                    {apt.prescriptionId != null ? (
                      <TouchableOpacity
                        style={styles.prescriptionBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: '/prescription-detail',
                            params: { prescriptionId: String(apt.prescriptionId) },
                          })
                        }
                      >
                        <Ionicons name="document-text-outline" size={14} color="#1a1a2e" />
                        <Text style={styles.prescriptionText}>Prescription</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={selectedApt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedApt(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedApt(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedApt ? (
                  <>
                    <View style={styles.modalDoctorRow}>
                      <View style={styles.modalAvatarWrapper}>
                        <Image source={{ uri: PLACEHOLDER_AVATAR }} style={styles.modalAvatar} />
                      </View>
                      <View style={styles.modalDoctorInfo}>
                        <Text style={styles.modalDoctorName}>{doctorTitle(selectedApt.doctorName)}</Text>
                        <Text style={styles.modalDoctorSpecialty}>
                          {selectedApt.doctorSpecialization || '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailCard}>
                      <Ionicons name="calendar-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Date</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedApt.appointmentDate?.split('T')[0]} · {formatTimeLabel(selectedApt.startTime)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailCard}>
                      <Ionicons name="pricetag-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Fee</Text>
                        <Text style={styles.modalDetailValue}>
                          {formatConsultationFee(selectedApt.consultationFee)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailCard}>
                      <Ionicons name="flag-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Status</Text>
                        <Text style={styles.modalDetailValue}>{statusDisplay(selectedApt.status).label}</Text>
                      </View>
                    </View>

                    <Text style={styles.modalReasonLabel}>Cancellation reason</Text>
                    <TextInput
                      style={styles.modalReasonInput}
                      placeholder="Required to cancel"
                      placeholderTextColor="#9ca3af"
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      multiline
                    />

                    <View style={styles.modalBtnsRow}>
                      <TouchableOpacity
                        style={styles.rescheduleBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          const apt = selectedApt;
                          setSelectedApt(null);
                          if (apt?.doctorId) {
                            router.push({
                              pathname: '/make-appointment',
                              params: {
                                doctorId: String(apt.doctorId),
                                name: doctorTitle(apt.doctorName),
                                specialty: apt.doctorSpecialization || '',
                                image: PLACEHOLDER_AVATAR,
                              },
                            });
                          }
                        }}
                      >
                        <LinearGradient
                          colors={['#5b9bd5', '#4a8ec4']}
                          style={styles.rescheduleBtnGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.rescheduleBtnText}>Book / Reschedule</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageModalBtn}
                        activeOpacity={0.7}
                        onPress={() => setSelectedApt(null)}
                      >
                        <Text style={styles.messageModalBtnText}>Close</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.cancelAppointmentLink}
                      onPress={confirmCancel}
                      activeOpacity={0.7}
                      disabled={cancelling}
                    >
                      <Text style={styles.cancelAppointmentText}>
                        {cancelling ? 'Cancelling…' : 'Confirm cancel appointment'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  safeArea: { flex: 1 },
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
  emptyLine: { fontSize: 14, color: '#8a8a9e', marginBottom: 12 },
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  codeSmall: { fontSize: 10, color: '#8a8a9e', maxWidth: 80, textAlign: 'right' },

  upcomingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  upcomingRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    width: 72,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  dateDay: { fontSize: 24, fontWeight: '800', color: '#fff' },
  dateMonth: { fontSize: 12, fontWeight: '500', color: '#fff', marginTop: 1 },
  dateDivider: { width: '70%', height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 5 },
  dateTime: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  upcomingAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 10,
  },
  upcomingAvatar: { width: '100%', height: '100%' },
  upcomingInfo: { flex: 1 },
  upcomingNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  upcomingName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  upcomingSpecialty: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },
  upcomingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  upcomingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f8',
    paddingTop: 12,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 5,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  payBtn: { borderRadius: 18, overflow: 'hidden' },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 5,
    borderRadius: 18,
  },
  payBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  pastCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pastRow: { flexDirection: 'row', alignItems: 'center' },
  pastAvatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 12,
  },
  pastAvatar: { width: '100%', height: '100%' },
  pastInfo: { flex: 1 },
  pastNameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pastName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  pastSpecialty: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },
  pastStatusHint: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: '600' },
  pastPrice: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginLeft: 8 },

  pastFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pastDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 8 },
  pastDateText: { fontSize: 12, color: '#6b7280', flex: 1 },
  pastActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  leaveReviewBtn: { borderRadius: 18, overflow: 'hidden' },
  leaveReviewGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  leaveReviewText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#d0dbe8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  prescriptionText: { fontSize: 12, fontWeight: '600', color: '#1a1a2e' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
  },
  modalDoctorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#7dd3c8',
    marginRight: 14,
  },
  modalAvatar: { width: '100%', height: '100%' },
  modalDoctorInfo: { flex: 1 },
  modalDoctorName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalDoctorSpecialty: { fontSize: 14, color: '#8a8a9e', marginTop: 2 },

  modalDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eef5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  modalDetailInfo: { flex: 1 },
  modalDetailLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  modalDetailValue: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },

  modalReasonLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginTop: 8 },
  modalReasonInput: {
    borderWidth: 1,
    borderColor: '#e8eef5',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    minHeight: 64,
    fontSize: 14,
    color: '#1a1a2e',
    textAlignVertical: 'top',
  },

  modalBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  rescheduleBtn: { flex: 1, borderRadius: 22, overflow: 'hidden' },
  rescheduleBtnGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 22 },
  rescheduleBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  messageModalBtn: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    paddingVertical: 14,
    alignItems: 'center',
  },
  messageModalBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  cancelAppointmentLink: { alignSelf: 'center', marginTop: 14 },
  cancelAppointmentText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
});
