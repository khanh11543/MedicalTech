import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ApiError } from '../services/apiClient';
import {
  fetchPatientPayment,
  initPatientMomoPayment,
  fetchPatientPaymentQr,
  type PatientPaymentDto,
  type PaymentInitDto,
  type PaymentQrDto,
} from '../services/patientPortalApi';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face';

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

/** Same grouping as web patient payment UI: `toLocaleString('en-US')` + VND (amounts are stored in `currency`). */
function formatVnd(amount: number | string | null | undefined, currency?: string | null): string {
  const n = num(amount);
  const suffix = (currency || 'VND').toUpperCase() === 'VND' ? 'VND' : (currency || 'VND').toUpperCase();
  return `${n.toLocaleString('en-US')} ${suffix}`;
}

function formatAppointmentDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type MomoStep = 'loading' | 'qr' | 'error' | 'success';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctor: string;
    specialty: string;
    date: string;
    time: string;
    image: string;
    paymentId: string;
  }>();

  const paymentIdNum = params.paymentId ? parseInt(params.paymentId, 10) : NaN;

  const doctorFallback = params.doctor || 'Doctor';
  const specialtyFallback = params.specialty || '';
  const dateFallback = params.date || '';
  const timeFallback = params.time || '';
  const imageUri = params.image || PLACEHOLDER_AVATAR;

  const [payment, setPayment] = useState<PatientPaymentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [momoVisible, setMomoVisible] = useState(false);
  /** Bumps when user taps Retry in the MoMo modal so init runs again without closing. */
  const [momoAttempt, setMomoAttempt] = useState(0);
  const [momoStep, setMomoStep] = useState<MomoStep>('loading');
  const [initData, setInitData] = useState<PaymentInitDto | null>(null);
  const [qrData, setQrData] = useState<PaymentQrDto | null>(null);
  const [momoError, setMomoError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadPayment = useCallback(async () => {
    if (!Number.isFinite(paymentIdNum)) {
      setLoadError('Missing or invalid payment.');
      setPayment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const p = await fetchPatientPayment(paymentIdNum);
      setPayment(p);
    } catch (e) {
      setPayment(null);
      setLoadError(e instanceof ApiError ? e.message : 'Could not load payment.');
    } finally {
      setLoading(false);
    }
  }, [paymentIdNum]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const startPolling = useCallback(
    (id: number) => {
      clearPoll();
      pollRef.current = setInterval(async () => {
        try {
          const updated = await fetchPatientPayment(id);
          const st = (updated.paymentStatus || '').toUpperCase();
          if (st === 'PAID') {
            clearPoll();
            setPayment(updated);
            setMomoStep('success');
            setTimeout(() => {
              setMomoVisible(false);
              router.replace('/my-appointments');
            }, 2000);
          } else if (st === 'CANCELLED' || st === 'FAILED' || st === 'EXPIRED') {
            clearPoll();
            setMomoError(`Payment was ${st.toLowerCase()}.`);
            setMomoStep('error');
          }
        } catch {
          /* ignore transient poll errors */
        }
      }, 5000);
    },
    [clearPoll, router],
  );

  useEffect(() => {
    if (!momoVisible || payment == null || !Number.isFinite(paymentIdNum)) {
      clearPoll();
      return;
    }

    let cancelled = false;
    setMomoStep('loading');
    setMomoError('');
    setInitData(null);
    setQrData(null);

    (async () => {
      try {
        const init = await initPatientMomoPayment(payment.id);
        if (cancelled) return;
        setInitData(init);
        if (!init.success) {
          setMomoError(init.message || 'Failed to initialize MoMo payment.');
          setMomoStep('error');
          return;
        }
        try {
          const qr = await fetchPatientPaymentQr(payment.id);
          if (!cancelled) setQrData(qr);
        } catch {
          /* QR may lag; payUrl from init still works */
        }
        if (!cancelled) {
          setMomoStep('qr');
          startPolling(payment.id);
        }
      } catch (e) {
        if (!cancelled) {
          setMomoError(e instanceof ApiError ? e.message : 'Failed to initialize MoMo payment.');
          setMomoStep('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [momoVisible, momoAttempt, payment?.id, paymentIdNum, clearPoll, startPolling]);

  const closeMomo = () => {
    clearPoll();
    setMomoVisible(false);
    setMomoStep('loading');
    setInitData(null);
    setQrData(null);
    setMomoError('');
    loadPayment();
  };

  const openMomoApp = async () => {
    const url = qrData?.payUrl || initData?.payUrl;
    if (!url) return;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
    else Alert.alert('MoMo', 'Could not open payment link on this device.');
  };

  const statusUpper = (payment?.paymentStatus || '').toUpperCase();
  const isPaid = statusUpper === 'PAID';
  const cannotPayOnline = statusUpper === 'PAID' || statusUpper === 'REFUNDED';
  const canPayWithMomo = payment != null && !cannotPayOnline && Number.isFinite(paymentIdNum);

  const doctorName = payment?.doctorName?.trim() || doctorFallback;
  const specialty = payment?.doctorSpecialty?.trim() || specialtyFallback;
  const apptDate =
    formatAppointmentDate(payment?.appointmentDate ?? null) || dateFallback;
  const displayTime = timeFallback;

  const currency = payment?.currency;

  const qrUri = qrData?.qrPayload || initData?.qrCodeUrl || '';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      {/* Removed bottom tint overlay (was causing pink haze). */}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading && (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color="#5b9bd5" />
              <Text style={styles.muted}>Loading payment…</Text>
            </View>
          )}

          {!loading && loadError ? (
            <View style={styles.centerBlock}>
              <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadPayment}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!loading && payment && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.cardLabel}>Order summary</Text>
                {payment.paymentCode ? (
                  <Text style={styles.paymentCode}>{payment.paymentCode}</Text>
                ) : null}

                <View style={styles.doctorRow}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: imageUri }} style={styles.avatar} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctorName}</Text>
                    {specialty ? <Text style={styles.doctorSpecialty}>{specialty}</Text> : null}
                  </View>
                </View>

                <View style={styles.divider} />

                {apptDate ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#5b9bd5" />
                    <Text style={styles.detailText}>{apptDate}</Text>
                  </View>
                ) : null}
                {displayTime ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#5b9bd5" />
                    <Text style={styles.detailText}>{displayTime}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Amount</Text>
                  <Text style={styles.priceValue}>{formatVnd(payment.amount, currency)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount</Text>
                  <Text style={styles.priceValue}>{formatVnd(payment.discountAmount, currency)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tax</Text>
                  <Text style={styles.priceValue}>{formatVnd(payment.taxAmount, currency)}</Text>
                </View>
                <View style={[styles.divider, { marginVertical: 10 }]} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatVnd(payment.totalAmount, currency)}</Text>
                </View>

                {isPaid ? (
                  <View style={styles.paidBanner}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    <Text style={styles.paidBannerText}>Paid</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.sectionTitle}>Payment method</Text>
              <View style={styles.momoCard}>
                <Ionicons name="wallet-outline" size={22} color="#5b9bd5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.momoTitle}>MoMo</Text>
                  <Text style={styles.momoHint}>Pay with MoMo wallet (same as web)</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {!loading && payment && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payBtnWrapper, !canPayWithMomo && styles.payBtnDisabled]}
              onPress={() => {
                if (!canPayWithMomo) return;
                setMomoVisible(true);
              }}
              activeOpacity={0.85}
              disabled={!canPayWithMomo}
            >
              <LinearGradient
                colors={canPayWithMomo ? ['#5b9bd5', '#4a8ec4'] : ['#9ca3af', '#9ca3af']}
                style={styles.payBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="wallet-outline" size={18} color="#fff" />
                <Text style={styles.payBtnText}>
                  {isPaid
                    ? 'Paid'
                    : `Pay ${formatVnd(payment.totalAmount, currency)}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <Modal
        visible={momoVisible}
        animationType="fade"
        transparent
        onRequestClose={closeMomo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={['#5b9bd5', '#4a8ec4']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>MoMo payment</Text>
                {payment?.paymentCode ? (
                  <Text style={styles.modalSubtitle}>{payment.paymentCode}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={closeMomo} hitSlop={12}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Payment amount</Text>
                <Text style={styles.amountValue}>
                  {formatVnd(payment?.totalAmount, currency)}
                </Text>
              </View>

              {momoStep === 'loading' && (
                <View style={styles.momoCenter}>
                  <ActivityIndicator size="large" color="#5b9bd5" />
                  <Text style={styles.muted}>Generating MoMo QR…</Text>
                </View>
              )}

              {momoStep === 'qr' && (
                <>
                  <View style={styles.qrFrame}>
                    {qrUri ? (
                      <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <Text style={styles.qrPlaceholderText}>
                          QR unavailable. Use the button below to open MoMo.
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.scanHint}>
                    Open <Text style={{ fontWeight: '700', color: '#ec4899' }}>MoMo</Text> and scan
                    the QR code to pay
                  </Text>
                  {(qrData?.payUrl || initData?.payUrl) && (
                    <TouchableOpacity style={styles.momoLinkBtn} onPress={openMomoApp}>
                      <Text style={styles.momoLinkBtnText}>Open MoMo to pay</Text>
                    </TouchableOpacity>
                  )}
                  {qrData?.expiresAt ? (
                    <Text style={styles.expires}>
                      Expires:{' '}
                      {new Date(qrData.expiresAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                  <View style={styles.pollRow}>
                    <View style={styles.pollDot} />
                    <Text style={styles.pollText}>Waiting for payment confirmation…</Text>
                  </View>
                </>
              )}

              {momoStep === 'success' && (
                <View style={styles.momoCenter}>
                  <Ionicons name="checkmark-circle" size={56} color="#10b981" />
                  <Text style={styles.successTitle}>Payment successful</Text>
                  <Text style={styles.muted}>Updating…</Text>
                </View>
              )}

              {momoStep === 'error' && (
                <View style={styles.momoCenter}>
                  <Ionicons name="close-circle" size={48} color="#ef4444" />
                  <Text style={styles.errorText}>{momoError}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      clearPoll();
                      setMomoStep('loading');
                      setMomoError('');
                      setInitData(null);
                      setQrData(null);
                      setMomoAttempt((a) => a + 1);
                    }}
                  >
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0 },
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 30 },
  centerBlock: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  muted: { fontSize: 14, color: '#6b7280' },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#5b9bd5',
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  paymentCode: { fontSize: 12, color: '#8a8a9e', marginBottom: 10 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 12,
  },
  avatar: { width: '100%', height: '100%' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  doctorSpecialty: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e8eef5', marginVertical: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailText: { fontSize: 14, color: '#6b7280' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: { fontSize: 14, color: '#6b7280' },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#5b9bd5' },
  paidBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  paidBannerText: { fontSize: 14, fontWeight: '700', color: '#059669' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  momoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#5b9bd5',
    gap: 12,
    marginBottom: 20,
  },
  momoTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  momoHint: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },

  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d0dbe8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  payBtnWrapper: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  payBtnDisabled: { opacity: 0.85 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRadius: 24,
  },
  payBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  modalBody: { padding: 18 },
  amountBox: {
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  amountLabel: { fontSize: 13, color: '#6b7280' },
  amountValue: { fontSize: 26, fontWeight: '800', color: '#2563eb', marginTop: 4 },
  momoCenter: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  qrFrame: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrImage: { width: 224, height: 224 },
  qrPlaceholder: {
    width: 224,
    height: 224,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  qrPlaceholderText: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  scanHint: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  momoLinkBtn: {
    backgroundColor: '#ec4899',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  momoLinkBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expires: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginBottom: 8 },
  pollRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pollDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  pollText: { fontSize: 11, color: '#9ca3af' },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#059669' },
});
