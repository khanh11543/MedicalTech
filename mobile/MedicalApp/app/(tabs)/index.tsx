import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import SideDrawer from '@/components/side-drawer';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';
import {
  fetchPatientDashboardStats,
  fetchPatientProfile,
  fetchPublicSpecialties,
  fetchTopDoctors,
  fetchGuideContents,
  type AppointmentDto,
  type DoctorCardDto,
  type PublicContentDto,
  type SpecialtyDto,
} from '@/services/dashboardApi';
import { formatConsultationFee, ratingNum, doctorHoursLabel } from '@/lib/doctorPresentation';
import { pickSpecialtyIcon, pickContentTitleIcon } from '@/lib/medicalIcons';

const { width } = Dimensions.get('window');

const PLACEHOLDER_USER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face';
const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatAppointmentWhen(a: AppointmentDto): string {
  try {
    const t = a.startTime?.length === 5 ? `${a.startTime}:00` : a.startTime;
    const d = new Date(`${a.appointmentDate}T${t}`);
    if (Number.isNaN(d.getTime())) return `${a.appointmentDate}`;
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return a.appointmentDate;
  }
}

export default function DashboardScreen() {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [userAvatar, setUserAvatar] = useState<string>(PLACEHOLDER_USER);
  const [nextAppointment, setNextAppointment] = useState<AppointmentDto | null>(null);
  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [contents, setContents] = useState<PublicContentDto[]>([]);
  const [topDoctors, setTopDoctors] = useState<DoctorCardDto[]>([]);
  const [bannerDoctor, setBannerDoctor] = useState<DoctorCardDto | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const [profile, stats, specs, docs, guides] = await Promise.all([
        fetchPatientProfile(),
        fetchPatientDashboardStats(),
        fetchPublicSpecialties(),
        fetchTopDoctors(10),
        fetchGuideContents(6),
      ]);

      const av = resolveBackendAbsoluteUrl(profile?.avatarUrl) ?? PLACEHOLDER_USER;
      setUserAvatar(av);
      setNextAppointment(stats?.nextAppointment ?? null);
      setSpecialties(specs.slice(0, 12));
      setTopDoctors(docs);
      setContents(guides);

      const neuro =
        docs.find((d) =>
          /thần kinh|neuro/i.test(d.primarySpecialty ?? '') ||
          (d.specialties?.some((s) => /thần kinh|neuro/i.test(s)) ?? false)
        ) ?? docs[0] ?? null;
      setBannerDoctor(neuro);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load data';
      setLoadError(msg);
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

  const onRefresh = useCallback(() => {
    load(true);
  }, [load]);

  const openDoctor = (d: DoctorCardDto) => {
    const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
    router.push({
      pathname: '/doctor-detail',
      params: {
        doctorId: String(d.id),
        name: d.fullName,
        specialty: d.primarySpecialty ?? d.specialties?.[0] ?? '',
        hours: doctorHoursLabel(d),
        price: formatConsultationFee(d.consultationFee),
        rating: String(ratingNum(d.ratingAvg)),
        image: img,
      },
    });
  };

  /** Banner “Book” goes straight to the booking flow, not doctor profile. */
  const openBookAppointment = (d: DoctorCardDto) => {
    const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
    router.push({
      pathname: '/make-appointment',
      params: {
        doctorId: String(d.id),
        name: d.fullName,
        specialty: d.primarySpecialty ?? d.specialties?.[0] ?? '',
        image: img,
      },
    });
  };

  const appt = nextAppointment;
  const apptImage =
    appt?.doctorId != null
      ? topDoctors.find((x) => x.id === appt.doctorId)?.avatarUrl
      : undefined;
  const apptAvatarUri =
    resolveBackendAbsoluteUrl(apptImage) ?? PLACEHOLDER_DOCTOR;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.loadingHint}>Loading from server…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b9bd5']} />
            }
          >
            {loadError ? (
              <Text style={styles.errorBanner}>{loadError}</Text>
            ) : null}

            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setDrawerVisible(true)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="menu" size={26} color="#1a1a2e" />
              </TouchableOpacity>
            </View>

            {/* ── My Appointments ── */}
            <Text style={styles.sectionTitle}>My appointments</Text>
            {appt ? (
              <View style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={styles.doctorAvatarWrapper}>
                    <Image source={{ uri: apptAvatarUri }} style={styles.doctorAvatar} />
                    <View style={styles.ratingBadge}>
                      <Ionicons name="calendar" size={10} color="#5b9bd5" />
                      <Text style={styles.ratingText}>Upcoming</Text>
                    </View>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.doctorName}>{appt.doctorName ?? 'Doctor'}</Text>
                      <TouchableOpacity>
                        <Ionicons name="ellipsis-vertical" size={18} color="#8a8a9e" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.specialty}>{appt.doctorSpecialization ?? ''}</Text>
                    <Text style={styles.appointmentDate}>{formatAppointmentWhen(appt)}</Text>
                    <View style={styles.appointmentActions}>
                      <TouchableOpacity style={styles.messageButton}>
                        <Text style={styles.messageButtonText}>Message</Text>
                      </TouchableOpacity>
                      <Text style={styles.priceText}>
                        {formatConsultationFee(appt.consultationFee)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No upcoming appointments.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={styles.emptyLink}>Find a doctor →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Categories (specialties) ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color="#8a8a9e" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {specialties.length === 0 ? (
                <Text style={styles.mutedInline}>Specialty list is being updated…</Text>
              ) : (
                specialties.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                    <View style={styles.categoryIcon}>
                      <MaterialCommunityIcons
                        name={pickSpecialtyIcon(cat.name)}
                        size={28}
                        color="#5b9bd5"
                      />
                    </View>
                    <Text style={styles.categoryName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* ── Diagnostics & Tests (guides / articles) ── */}
            <Text style={styles.sectionTitle}>Guides & resources</Text>
            {contents.length === 0 ? (
              <Text style={styles.mutedPadded}>No guides or articles are available yet.</Text>
            ) : (
              contents.map((item) => {
                const raw = item.summary?.trim() || item.body || '';
                const desc = raw ? stripHtml(raw).slice(0, 120) + (raw.length > 120 ? '…' : '') : '';
                return (
                  <TouchableOpacity key={item.id} style={styles.diagnosticCard}>
                    <View style={styles.diagnosticIcon}>
                      <MaterialCommunityIcons
                        name={pickContentTitleIcon(item.title)}
                        size={26}
                        color="#5b9bd5"
                      />
                    </View>
                    <View style={styles.diagnosticInfo}>
                      <Text style={styles.diagnosticTitle}>{item.title}</Text>
                      {desc ? (
                        <Text style={styles.diagnosticDesc} numberOfLines={2}>
                          {desc}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#c0c8d4" />
                  </TouchableOpacity>
                );
              })
            )}

            {/* ── Consultation Banner ── */}
            <View style={styles.bannerCard}>
              <LinearGradient
                colors={['#e8eef5', '#dce6f0']}
                style={styles.bannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextArea}>
                    <Text style={styles.bannerTitle}>
                      {bannerDoctor
                        ? bannerDoctor.primarySpecialty
                          ? `See a ${bannerDoctor.primarySpecialty} specialist today!`
                          : 'Book a consultation with a doctor today!'
                        : 'Book an appointment on MediTech'}
                    </Text>
                    <TouchableOpacity
                      style={styles.bannerButton}
                      onPress={() =>
                        bannerDoctor ? openBookAppointment(bannerDoctor) : router.push('/(tabs)/search')
                      }
                    >
                      <Text style={styles.bannerButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                  <Image
                    source={{
                      uri:
                        resolveBackendAbsoluteUrl(bannerDoctor?.avatarUrl) ??
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=250&fit=crop',
                    }}
                    style={styles.bannerImage}
                  />
                </View>
              </LinearGradient>
            </View>

            {/* ── Top Doctors ── */}
            <Text style={styles.sectionTitle}>Top doctors</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topDoctorsRow}
            >
              {topDoctors.length === 0 ? (
                <Text style={styles.mutedInline}>No doctors available.</Text>
              ) : (
                topDoctors.map((doc) => {
                  const img = resolveBackendAbsoluteUrl(doc.avatarUrl) ?? PLACEHOLDER_DOCTOR;
                  const r = ratingNum(doc.ratingAvg);
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.topDoctorCard}
                      onPress={() => openDoctor(doc)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.topDoctorImageWrapper}>
                        <Image source={{ uri: img }} style={styles.topDoctorImage} />
                        {r > 0 ? (
                          <View style={styles.topDoctorRating}>
                            <FontAwesome name="star" size={9} color="#ff6b35" />
                            <Text style={styles.topDoctorRatingText}>{r}</Text>
                          </View>
                        ) : null}
                        <TouchableOpacity style={styles.favoriteIcon}>
                          <Ionicons name="star-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.hoursChip}>
                          <Ionicons name="time-outline" size={11} color="#5b9bd5" />
                          <Text style={styles.hoursText} numberOfLines={1}>
                            {doctorHoursLabel(doc)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.topDoctorName} numberOfLines={1}>
                        {doc.fullName}
                      </Text>
                      <Text style={styles.topDoctorSpecialty} numberOfLines={1}>
                        {doc.primarySpecialty ?? doc.specialties?.[0] ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#8a8a9e',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#ffe8e8',
    borderRadius: 12,
    color: '#a32020',
    fontSize: 13,
  },
  mutedInline: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    color: '#8a8a9e',
    fontSize: 13,
  },
  mutedPadded: {
    paddingHorizontal: 20,
    marginBottom: 8,
    color: '#8a8a9e',
    fontSize: 13,
  },
  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8a8a9e',
    textAlign: 'center',
  },
  emptyLink: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#5b9bd5',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#e0e8f0',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },

  /* ── Section ── */
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8a8a9e',
    marginRight: 2,
  },

  /* ── Appointment Card ── */
  appointmentCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  appointmentRow: {
    flexDirection: 'row',
  },
  doctorAvatarWrapper: {
    width: 80,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  doctorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  specialty: {
    fontSize: 13,
    color: '#8a8a9e',
    marginTop: 2,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#5b9bd5',
    marginTop: 6,
  },
  appointmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#5b9bd5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },

  /* ── Categories ── */
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 78,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#1a1a2e',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* ── Diagnostics ── */
  diagnosticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  diagnosticIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  diagnosticInfo: {
    flex: 1,
    marginRight: 8,
  },
  diagnosticTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  diagnosticDesc: {
    fontSize: 12,
    color: '#8a8a9e',
    lineHeight: 17,
  },

  /* ── Banner ── */
  bannerCard: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  bannerGradient: {
    borderRadius: CARD_RADIUS,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bannerTextArea: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 24,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#5b9bd5',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerImage: {
    width: 110,
    height: 130,
    borderRadius: 12,
  },

  /* ── Top Doctors ── */
  topDoctorsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  topDoctorCard: {
    width: width * 0.4,
  },
  topDoctorImageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  topDoctorImage: {
    width: '100%',
    height: '100%',
  },
  topDoctorRating: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  topDoctorRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  hoursChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#ffffffdd',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  topDoctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  topDoctorSpecialty: {
    fontSize: 12,
    color: '#8a8a9e',
    marginTop: 2,
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
