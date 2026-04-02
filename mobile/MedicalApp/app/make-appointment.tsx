import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';
import { authStorage } from '@/lib/authStorage';
import { pickSpecialtyIcon } from '@/lib/medicalIcons';
import {
  fetchPublicDoctorsPage,
  fetchPublicSpecialties,
  type DoctorCardDto,
  type SpecialtyDto,
} from '@/services/dashboardApi';
import {
  fetchDoctorDetailPublic,
  fetchDoctorSlotsPublic,
  bookPatientAppointment,
  filterSlotsStartingInFuture,
  normalizeSlotTime,
  type TimeSlotDto,
} from '@/services/appointmentApi';

const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face';
const SLOT_RANGE_DAYS = 30;

type SelectedDoctor = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  primarySpecialty?: string | null;
};

function localTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function isBookableSlot(s: TimeSlotDto): boolean {
  if (!s.slotDate || !Number.isFinite(Number(s.id))) return false;
  if (s.isAvailable === false) return false;
  const st = (s.status || 'AVAILABLE').toUpperCase();
  if (st !== 'AVAILABLE') return false;
  return true;
}


function parseISODateLocal(iso: string): Date | null {
  const [y, mo, d] = iso.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d);
}

/** Day / month / year (numeric, e.g. 03/04/2026). */
function formatDateNumeric(iso: string): string {
  const dt = parseISODateLocal(iso);
  if (!dt) return iso;
  const d = dt.getDate();
  const m = dt.getMonth() + 1;
  const y = dt.getFullYear();
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** Weekday + full date (English). */
function formatDateLongEn(iso: string): string {
  const dt = parseISODateLocal(iso);
  if (!dt) return iso;
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Slot window from API: start–end (24h). */
function formatSlotTimeRange(slot: TimeSlotDto): string {
  const s = normalizeSlotTime(slot.startTime);
  const e = normalizeSlotTime(slot.endTime || slot.startTime);
  return `${s} – ${e}`;
}

function sortedUniqueDates(slots: TimeSlotDto[]): string[] {
  const set = new Set(slots.map((s) => s.slotDate));
  return [...set].sort();
}

function syntheticSpecialty(name: string): SpecialtyDto {
  return {
    id: 0,
    name,
    description: null,
    iconUrl: null,
    slug: '',
    subtitle: null,
  };
}

export default function MakeAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctorId?: string;
    specialtyId?: string;
    name?: string;
    specialty?: string;
    image?: string;
  }>();

  const [step, setStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyDto | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<SelectedDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);

  const [specialtyList, setSpecialtyList] = useState<SpecialtyDto[]>([]);
  const [specialtyListLoading, setSpecialtyListLoading] = useState(false);
  const [doctorList, setDoctorList] = useState<DoctorCardDto[]>([]);
  const [doctorListLoading, setDoctorListLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const [slots, setSlots] = useState<TimeSlotDto[]>([]);
  /** Bumps every 30s on date/time steps so past slots disappear without leaving the screen. */
  const [slotNowTick, setSlotNowTick] = useState(0);

  useEffect(() => {
    if (step < 3) return;
    const id = setInterval(() => setSlotNowTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [step]);

  const futureSlots = useMemo(
    () => filterSlotsStartingInFuture(slots),
    [slots, slotNowTick],
  );

  const availableDates = useMemo(() => sortedUniqueDates(futureSlots), [futureSlots]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return futureSlots
      .filter((s) => s.slotDate === selectedDate)
      .sort((a, b) =>
        normalizeSlotTime(a.startTime).localeCompare(normalizeSlotTime(b.startTime)),
      );
  }, [futureSlots, selectedDate]);

  /** If the chosen day no longer has any future slot, drop selection (e.g. after refresh). */
  useEffect(() => {
    if (!selectedDate) return;
    if (!availableDates.includes(selectedDate)) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setStep((s) => (s === 4 ? 3 : s));
    }
  }, [availableDates, selectedDate]);

  /** Clear picked time if it just moved into the past (tick / clock). */
  useEffect(() => {
    if (!selectedSlot) return;
    if (!futureSlots.some((s) => s.id === selectedSlot.id)) {
      setSelectedSlot(null);
    }
  }, [futureSlots, selectedSlot]);

  const loadDoctorsForSpecialty = useCallback(async (specialtyId: number) => {
    setDoctorListLoading(true);
    try {
      const docs = await fetchPublicDoctorsPage({
        specialtyId,
        pageNumber: 0,
        pageSize: 40,
        sortBy: 'ratingAvg',
        sortOrder: 'desc',
      });
      setDoctorList(docs);
    } catch {
      setDoctorList([]);
    } finally {
      setDoctorListLoading(false);
    }
  }, []);

  const pickSpecialty = useCallback(
    async (sp: SpecialtyDto) => {
      setSelectedSpecialty(sp);
      setContextError(null);
      await loadDoctorsForSpecialty(sp.id);
      setStep(2);
    },
    [loadDoctorsForSpecialty]
  );

  const applyDoctorLoadSlots = useCallback(async (id: number, fallback?: Partial<SelectedDoctor>) => {
    setContextLoading(true);
    setContextError(null);
    try {
      const from = localTodayISO();
      const to = addCalendarDays(from, SLOT_RANGE_DAYS);
      const [detail, slotList] = await Promise.all([
        fetchDoctorDetailPublic(id),
        fetchDoctorSlotsPublic(id, from, to),
      ]);

      setSelectedDoctor({
        id: detail.id,
        fullName: detail.fullName,
        avatarUrl: detail.avatarUrl ?? fallback?.avatarUrl ?? null,
        primarySpecialty: detail.primarySpecialty ?? fallback?.primarySpecialty ?? null,
      });

      setSlots(slotList.filter(isBookableSlot));
      setSelectedDate(null);
      setSelectedSlot(null);
      setStep(3);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load doctor or schedule';
      setContextError(msg);
      Alert.alert('Unable to continue', msg);
    } finally {
      setContextLoading(false);
    }
  }, []);

  const handleDeepLinkDoctor = useCallback(
    async (docId: number, preferredSpecialtyId: number) => {
      setContextLoading(true);
      setContextError(null);
      try {
        const detail = await fetchDoctorDetailPublic(docId);
        const from = localTodayISO();
        const to = addCalendarDays(from, SLOT_RANGE_DAYS);
        const slotList = await fetchDoctorSlotsPublic(docId, from, to);

        let spec: SpecialtyDto | null = null;
        const specs = detail.specialties ?? [];
        if (Number.isFinite(preferredSpecialtyId) && preferredSpecialtyId > 0 && specs.length > 0) {
          spec = specs.find((s) => Number(s.id) === preferredSpecialtyId) ?? specs[0];
        } else if (specs.length > 0) {
          spec = specs[0];
        } else if (detail.primarySpecialty) {
          spec = syntheticSpecialty(detail.primarySpecialty);
        }

        setSelectedSpecialty(spec);
        setSelectedDoctor({
          id: detail.id,
          fullName: detail.fullName,
          avatarUrl: detail.avatarUrl ?? undefined,
          primarySpecialty: detail.primarySpecialty,
        });
        setSlots(slotList.filter(isBookableSlot));
        setSelectedDate(null);
        setSelectedSlot(null);
        setStep(3);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Could not load doctor';
        setContextError(msg);
        Alert.alert('Error', msg);
        setStep(1);
        setSpecialtyListLoading(true);
        fetchPublicSpecialties()
          .then(setSpecialtyList)
          .catch(() => setSpecialtyList([]))
          .finally(() => setSpecialtyListLoading(false));
      } finally {
        setContextLoading(false);
      }
    },
    []
  );

  const handleDeepLinkSpecialty = useCallback(
    async (specId: number) => {
      setSpecialtyListLoading(true);
      try {
        const specs = await fetchPublicSpecialties();
        setSpecialtyList(specs);
        const found = specs.find((s) => Number(s.id) === specId);
        if (found) {
          setSelectedSpecialty(found);
          await loadDoctorsForSpecialty(found.id);
          setStep(2);
        }
      } catch {
        setSpecialtyList([]);
      } finally {
        setSpecialtyListLoading(false);
      }
    },
    [loadDoctorsForSpecialty]
  );

  useEffect(() => {
    const docId = params.doctorId ? Number(params.doctorId) : NaN;
    const specId = params.specialtyId ? Number(params.specialtyId) : NaN;

    if (Number.isFinite(docId) && docId > 0) {
      void handleDeepLinkDoctor(docId, Number.isFinite(specId) ? specId : 0);
      return;
    }

    if (Number.isFinite(specId) && specId > 0) {
      void handleDeepLinkSpecialty(specId);
      return;
    }

    setSpecialtyListLoading(true);
    fetchPublicSpecialties()
      .then(setSpecialtyList)
      .catch(() => setSpecialtyList([]))
      .finally(() => setSpecialtyListLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial route params only
  }, []);

  const pickDoctorFromList = (doc: DoctorCardDto) => {
    void applyDoctorLoadSlots(doc.id, {
      fullName: doc.fullName,
      primarySpecialty: doc.primarySpecialty ?? undefined,
      avatarUrl: doc.avatarUrl ?? undefined,
    });
  };

  const changeSpecialty = () => {
    setStep(1);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setDoctorList([]);
    setSlots([]);
    setContextError(null);
    if (specialtyList.length === 0) {
      setSpecialtyListLoading(true);
      fetchPublicSpecialties()
        .then(setSpecialtyList)
        .finally(() => setSpecialtyListLoading(false));
    }
  };

  const changeDoctor = () => {
    if (!selectedSpecialty) return;
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setContextError(null);
    void loadDoctorsForSpecialty(selectedSpecialty.id);
    setStep(2);
  };

  const goBack = () => {
    if (step <= 1) {
      router.back();
      return;
    }
    if (step === 2) {
      setStep(1);
      setSelectedSpecialty(null);
      setDoctorList([]);
      setContextError(null);
      return;
    }
    if (step === 3) {
      setSelectedDoctor(null);
      setSlots([]);
      setSelectedDate(null);
      setSelectedSlot(null);
      setContextError(null);
      if (selectedSpecialty) void loadDoctorsForSpecialty(selectedSpecialty.id);
      setStep(2);
      return;
    }
    if (step === 4) {
      setStep(3);
      setSelectedSlot(null);
    }
  };

  const continueFromDate = () => {
    if (!selectedDate) {
      Alert.alert('Select a date', 'Please choose an appointment date.');
      return;
    }
    setStep(4);
  };

  const submitBooking = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    const token = await authStorage.getAccessToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to book an appointment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/sign-in') },
      ]);
      return;
    }

    if (!Number.isFinite(selectedSlot.id) || selectedSlot.id <= 0) {
      Alert.alert('Invalid slot', 'Please choose a time slot again.');
      return;
    }

    setBooking(true);
    try {
      await bookPatientAppointment({
        patientId: 1,
        doctorId: selectedDoctor.id,
        appointmentDate: selectedSlot.slotDate,
        timeSlotId: selectedSlot.id,
        reasonForVisit: reason.trim() || undefined,
      });
      Alert.alert('Booked', 'Your appointment has been submitted.', [
        { text: 'OK', onPress: () => router.replace('/my-appointments') },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Booking failed';
      Alert.alert('Booking failed', msg);
    } finally {
      setBooking(false);
    }
  };

  const doctorImageUri =
    resolveBackendAbsoluteUrl(selectedDoctor?.avatarUrl) ?? PLACEHOLDER_DOCTOR;
  const stepTitles = ['Specialty', 'Doctor', 'Date', 'Time'];

  const dateContinueDisabled = !selectedDate || availableDates.length === 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      {/* Removed bottom tint overlay (was causing pink haze). */}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stepBar}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={styles.stepItem}>
              <View style={[styles.stepDot, step >= n && styles.stepDotActive]} />
              <Text style={[styles.stepLabel, step === n && styles.stepLabelActive]} numberOfLines={1}>
                {stepTitles[n - 1]}
              </Text>
            </View>
          ))}
        </View>

        {contextLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.loadingText}>Loading schedule…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {contextError && step > 2 ? <Text style={styles.errorText}>{contextError}</Text> : null}

            {/* Step 1 — Specialty / department first */}
            {step === 1 && (
              <>
                <Text style={styles.sectionTitle}>1. Choose department (specialty)</Text>
                {specialtyListLoading ? (
                  <ActivityIndicator style={{ marginVertical: 24 }} color="#5b9bd5" />
                ) : specialtyList.length === 0 ? (
                  <Text style={styles.emptyText}>No specialties available.</Text>
                ) : (
                  <View style={styles.specialtyGrid}>
                    {specialtyList.map((sp) => (
                      <TouchableOpacity
                        key={sp.id}
                        style={styles.specialtyCard}
                        onPress={() => pickSpecialty(sp)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.specialtyIconBox}>
                          <MaterialCommunityIcons
                            name={pickSpecialtyIcon(sp.name)}
                            size={28}
                            color="#5b9bd5"
                          />
                        </View>
                        <Text style={styles.specialtyName} numberOfLines={2}>
                          {sp.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Step 2 — Doctor in this specialty */}
            {step === 2 && selectedSpecialty && (
              <>
                <View style={styles.specialtyBanner}>
                  <Text style={styles.specialtyBannerLabel}>Department</Text>
                  <Text style={styles.specialtyBannerName}>{selectedSpecialty.name}</Text>
                  <TouchableOpacity onPress={changeSpecialty} hitSlop={8}>
                    <Text style={styles.changeLink}>Change department</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>2. Choose a doctor</Text>
                {doctorListLoading ? (
                  <ActivityIndicator style={{ marginVertical: 24 }} color="#5b9bd5" />
                ) : doctorList.length === 0 ? (
                  <Text style={styles.emptyText}>No doctors in this specialty yet.</Text>
                ) : (
                  doctorList.map((doc) => {
                    const img = resolveBackendAbsoluteUrl(doc.avatarUrl) ?? PLACEHOLDER_DOCTOR;
                    return (
                      <TouchableOpacity
                        key={doc.id}
                        style={styles.doctorPickRow}
                        onPress={() => pickDoctorFromList(doc)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: img }} style={styles.doctorPickAvatar} />
                        <View style={styles.doctorPickInfo}>
                          <Text style={styles.doctorPickName}>{doc.fullName}</Text>
                          <Text style={styles.doctorPickSpec} numberOfLines={1}>
                            {doc.primarySpecialty ?? doc.specialties?.[0] ?? selectedSpecialty.name}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#c0c8d4" />
                      </TouchableOpacity>
                    );
                  })
                )}
              </>
            )}

            {/* Steps 3–4 — summary */}
            {step >= 3 && selectedDoctor && (
              <View style={styles.summaryStack}>
                {selectedSpecialty ? (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryRowText}>
                      <Text style={styles.summaryMuted}>Department</Text>
                      <Text style={styles.summaryStrong}>{selectedSpecialty.name}</Text>
                    </View>
                    <TouchableOpacity onPress={changeSpecialty} hitSlop={8}>
                      <Text style={styles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.summaryCard}>
                  <Image source={{ uri: doctorImageUri }} style={styles.summaryAvatar} />
                  <View style={styles.summaryText}>
                    <Text style={styles.summaryName}>{selectedDoctor.fullName}</Text>
                    <Text style={styles.summarySpec} numberOfLines={2}>
                      {selectedDoctor.primarySpecialty ?? selectedSpecialty?.name ?? ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={changeDoctor} hitSlop={8}>
                    <Text style={styles.changeLink}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3 — Date */}
            {step === 3 && (
              <>
                <Text style={styles.sectionTitle}>3. Choose date</Text>
                {availableDates.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No open slots in the next {SLOT_RANGE_DAYS} days for this doctor.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {availableDates.map((iso) => {
                      const on = selectedDate === iso;
                      return (
                        <TouchableOpacity
                          key={iso}
                          style={[styles.dateChip, on && styles.dateChipOn]}
                          onPress={() => {
                            setSelectedDate(iso);
                            setSelectedSlot(null);
                          }}
                        >
                          <Text
                            style={[styles.dateChipWeekday, on && styles.dateChipWeekdayOn]}
                            numberOfLines={1}
                          >
                            {parseISODateLocal(iso)?.toLocaleDateString('vi-VN', {
                              weekday: 'short',
                            }) ?? ''}
                          </Text>
                          <Text style={[styles.dateChipFull, on && styles.dateChipFullOn]}>
                            {formatDateNumeric(iso)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            {/* Step 4 — Time */}
            {step === 4 && (
              <>
                <Text style={styles.sectionTitle}>4. Choose time</Text>
                <Text style={styles.subHint}>
                  {selectedDate ? formatDateLongEn(selectedDate) : ''}
                </Text>
                <View style={styles.timeGrid}>
                  {slotsForSelectedDate.map((slot) => {
                    const on = selectedSlot?.id === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.timeChip, on && styles.timeChipOn]}
                        onPress={() => setSelectedSlot(slot)}
                      >
                        <Text style={[styles.timeChipText, on && styles.timeChipTextOn]}>
                          {formatSlotTimeRange(slot)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {slotsForSelectedDate.length === 0 ? (
                  <Text style={styles.emptyText}>No times for this date.</Text>
                ) : null}

                <Text style={styles.sectionTitle}>Reason (optional)</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Brief reason for visit"
                  placeholderTextColor="#a8a8b8"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                />
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          {step === 3 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={continueFromDate}
              disabled={dateContinueDisabled}
            >
              <LinearGradient
                colors={!dateContinueDisabled ? ['#5b9bd5', '#4a8ec4'] : ['#b8c8d8', '#a8b8c8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Continue to time</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {step === 4 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={submitBooking}
              disabled={!selectedSlot || booking}
            >
              <LinearGradient
                colors={selectedSlot && !booking ? ['#5b9bd5', '#4a8ec4'] : ['#b8c8d8', '#a8b8c8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {booking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm booking</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
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
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4eaf2',
  },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0dbe8',
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: '#5b9bd5' },
  stepLabel: { fontSize: 10, color: '#8a8a9e', textAlign: 'center' },
  stepLabelActive: { color: '#5b9bd5', fontWeight: '700' },
  loadingBlock: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#8a8a9e', fontSize: 14 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  errorText: { color: '#c0392b', marginBottom: 12, fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 14, marginTop: 8 },
  subHint: { fontSize: 14, color: '#8a8a9e', marginBottom: 12, marginTop: -8 },
  emptyText: { fontSize: 14, color: '#8a8a9e', marginBottom: 16 },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specialtyCard: {
    width: '30%',
    flexGrow: 1,
    minWidth: 96,
    maxWidth: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  specialtyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  specialtyBanner: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  specialtyBannerLabel: { fontSize: 12, color: '#8a8a9e', marginBottom: 4 },
  specialtyBannerName: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  doctorPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  doctorPickAvatar: { width: 48, height: 48, borderRadius: 12, marginRight: 12 },
  doctorPickInfo: { flex: 1 },
  doctorPickName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  doctorPickSpec: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  summaryStack: { marginBottom: 16, gap: 10 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  summaryRowText: { flex: 1 },
  summaryMuted: { fontSize: 12, color: '#8a8a9e' },
  summaryStrong: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginTop: 2 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  summaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#7dd3c8',
  },
  summaryText: { flex: 1 },
  summaryName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  summarySpec: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  changeLink: { fontSize: 14, fontWeight: '600', color: '#5b9bd5' },
  dateScroll: { marginBottom: 8 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#d0dbe8',
    minWidth: 108,
    alignItems: 'center',
  },
  dateChipOn: { backgroundColor: '#5b9bd5', borderColor: '#5b9bd5' },
  dateChipWeekday: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a8a9e',
    marginBottom: 4,
  },
  dateChipWeekdayOn: { color: 'rgba(255,255,255,0.9)' },
  dateChipFull: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  dateChipFullOn: { color: '#fff' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#d0dbe8',
  },
  timeChipOn: { backgroundColor: '#5b9bd5', borderColor: '#5b9bd5' },
  timeChipText: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  timeChipTextOn: { color: '#fff' },
  reasonInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1a1a2e',
    marginBottom: 16,
  },
  bottomBar: { paddingHorizontal: 24, paddingVertical: 12 },
  primaryBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 28 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
