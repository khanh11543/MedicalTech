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
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import SideDrawer from '@/components/side-drawer';
import MediTechLogo from '@/components/meditech-logo';
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
import { addPatientFavorite, fetchPatientFavorites, removePatientFavorite } from '@/services/favoritesApi';
import { formatConsultationFee, ratingNum, doctorHoursLabel } from '@/lib/doctorPresentation';
import { pickSpecialtyIcon, pickContentTitleIcon } from '@/lib/medicalIcons';

const { width } = Dimensions.get('window');

const PLACEHOLDER_USER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face';
const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

const INTERNATIONAL_NEWS: Array<{
  id: string;
  source: string;
  title: string;
  url: string;
  imageUrl: string;
}> = [
  {
    id: 'who',
    source: 'World Health Organization',
    title: 'Global health updates and guidance',
    url: 'https://www.who.int/news-room',
    imageUrl:
      'https://images.unsplash.com/photo-1584036561584-b03c19da874c?w=1200&auto=format&fit=crop&q=60',
  },
  {
    id: 'cdc',
    source: 'CDC',
    title: 'Public health news and recommendations',
    url: 'https://www.cdc.gov/media/index.html',
    imageUrl:
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&auto=format&fit=crop&q=60',
  },
  {
    id: 'nejm',
    source: 'NEJM',
    title: 'Latest research and clinical perspectives',
    url: 'https://www.nejm.org/',
    imageUrl:
      'https://images.unsplash.com/photo-1580281657527-47f249e3f6a9?w=1200&auto=format&fit=crop&q=60',
  },
  {
    id: 'nature-medicine',
    source: 'Nature Medicine',
    title: 'Breakthroughs in translational medicine',
    url: 'https://www.nature.com/nm/',
    imageUrl:
      'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&auto=format&fit=crop&q=60',
  },
];

const PAST_APPT_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);
const HOUR_MS = 60 * 60 * 1000;

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function openExternal(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      try {
        await Linking.openURL(url);
        return;
      } catch {
        // fall through to WebBrowser
      }
    }
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      showTitle: true,
      enableBarCollapsing: true,
    });
  } catch {
    Alert.alert('Could not open link', 'Please try again.');
  }
}

function timeToMsOnDate(y: number, mo: number, d: number, raw: string | undefined | null): number | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  const sec = parseInt(parts[2] ?? '0', 10);
  if (!Number.isFinite(h)) return null;
  const local = new Date(
    y,
    mo - 1,
    d,
    h,
    Number.isFinite(m) ? m : 0,
    Number.isFinite(sec) ? sec : 0,
    0
  );
  const ms = local.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** End of visit window: endTime if present, else start + 1h, else end of that calendar day. */
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

function isAppointmentExpiredOrPast(apt: AppointmentDto): boolean {
  const status = (apt.status ?? '').toUpperCase();
  if (PAST_APPT_STATUSES.has(status)) return true;
  const end = appointmentEndMs(apt);
  return end > 0 && end < Date.now();
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
  const [patientId, setPatientId] = useState<number | null>(null);
  const [favoriteByDoctorId, setFavoriteByDoctorId] = useState<Map<number, number>>(new Map());
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
      setPatientId(profile?.patientId ?? null);
      const next = stats?.nextAppointment ?? null;
      setNextAppointment(next && !isAppointmentExpiredOrPast(next) ? next : null);
      setSpecialties(specs.slice(0, 4));
      setTopDoctors(docs);
      setContents(guides);

      // Favorites (for top doctors star toggle)
      if (profile?.patientId) {
        try {
          const favRes = await fetchPatientFavorites(profile.patientId, 0, 500);
          const map = new Map<number, number>();
          for (const f of favRes.favorites ?? []) {
            if (typeof f.doctorId === 'number' && typeof f.id === 'number') {
              map.set(f.doctorId, f.id);
            }
          }
          setFavoriteByDoctorId(map);
        } catch {
          // ignore favorites load failure (UI still works on toggle attempt)
          setFavoriteByDoctorId(new Map());
        }
      } else {
        setFavoriteByDoctorId(new Map());
      }

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

  const toggleFavorite = async (doctorId: number) => {
    if (!patientId) return;
    const existingFavoriteId = favoriteByDoctorId.get(doctorId) ?? null;

    // optimistic
    setFavoriteByDoctorId((prev) => {
      const next = new Map(prev);
      if (existingFavoriteId) next.delete(doctorId);
      else next.set(doctorId, -1);
      return next;
    });

    try {
      if (existingFavoriteId) {
        await removePatientFavorite(patientId, existingFavoriteId);
        setFavoriteByDoctorId((prev) => {
          const next = new Map(prev);
          next.delete(doctorId);
          return next;
        });
      } else {
        const created = await addPatientFavorite(patientId, doctorId);
        setFavoriteByDoctorId((prev) => {
          const next = new Map(prev);
          next.set(doctorId, created.id);
          return next;
        });
      }
    } catch {
      // revert by reloading favorites best-effort
      try {
        const favRes = await fetchPatientFavorites(patientId, 0, 500);
        const map = new Map<number, number>();
        for (const f of favRes.favorites ?? []) {
          if (typeof f.doctorId === 'number' && typeof f.id === 'number') map.set(f.doctorId, f.id);
        }
        setFavoriteByDoctorId(map);
      } catch {
        // last resort: undo optimistic for this item
        setFavoriteByDoctorId((prev) => {
          const next = new Map(prev);
          if (existingFavoriteId) next.set(doctorId, existingFavoriteId);
          else next.delete(doctorId);
          return next;
        });
      }
    }
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
              <View style={styles.headerTopRow}>
                <View style={styles.brandWrap}>
                  <MediTechLogo size="md" />
                  <Text style={styles.brandTagline} numberOfLines={1}>
                    Smart Healthcare, Trusted by You
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDrawerVisible(true)}>
                  <View style={styles.avatarContainer}>
                    <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Categories (specialties) ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => router.push('/specialties')}
              >
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color="#8a8a9e" />
              </TouchableOpacity>
            </View>
            {specialties.length === 0 ? (
              <Text style={styles.mutedPadded}>Specialty list is being updated…</Text>
            ) : (
              <View style={styles.categoriesGrid}>
                {specialties.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryItemBig}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/specialty-detail',
                        params: { specialtyId: String(cat.id), name: cat.name },
                      })
                    }
                  >
                    <View style={styles.categoryIconBig}>
                      <MaterialCommunityIcons name={pickSpecialtyIcon(cat.name)} size={34} color="#5b9bd5" />
                    </View>
                    <Text style={styles.categoryNameBig} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                      <Text style={styles.priceText}>{formatConsultationFee(appt.consultationFee)}</Text>
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
                colors={['#eef6ff', '#e7f0fb', '#ddeaf7']}
                style={styles.bannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextArea}>
                    <Text style={styles.bannerEyebrow}>MediTech</Text>
                    <Text style={styles.bannerTitle}>Book appointment</Text>
                    <Text style={styles.bannerSubtitle}>
                      Smart Healthcare, Trusted by You. Book in minutes and get care you can rely on.
                    </Text>
                    <TouchableOpacity
                      style={styles.bannerButton}
                      onPress={() =>
                        bannerDoctor ? openBookAppointment(bannerDoctor) : router.push('/(tabs)/search')
                      }
                    >
                      <Text style={styles.bannerButtonText}>Book appointment</Text>
                    </TouchableOpacity>
                  </View>
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
                  const favId = favoriteByDoctorId.get(doc.id);
                  const isFav = favId != null;
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
                        <TouchableOpacity
                          style={styles.favoriteIcon}
                          onPress={() => toggleFavorite(doc.id)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name={isFav ? 'star' : 'star-outline'} size={16} color={isFav ? '#ffcc00' : '#fff'} />
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

            {/* ── International News ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>International health news</Text>
              <TouchableOpacity
                style={styles.viewAllRow}
                onPress={() => void openExternal('https://news.google.com/search?q=health')}
              >
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color="#8a8a9e" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsRow}>
              {INTERNATIONAL_NEWS.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={styles.newsCard}
                  activeOpacity={0.85}
                  onPress={() => void openExternal(n.url)}
                >
                  <Image source={{ uri: n.imageUrl }} style={styles.newsImage} />
                  <View style={styles.newsBody}>
                    <Text style={styles.newsSource} numberOfLines={1}>
                      {n.source}
                    </Text>
                    <Text style={styles.newsTitle} numberOfLines={3}>
                      {n.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Other features ── */}
            <Text style={styles.sectionTitle}>Other features</Text>
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => router.push('/help-support')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="help-buoy-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  Help & Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => router.push('/specialties')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="grid-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  Specialties
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => router.push('/my-tests')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="flask-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  Tests & diagnostics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="notifications-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => void openExternal('https://news.google.com/search?q=health')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="newspaper-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  News & events
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickItem}
                activeOpacity={0.85}
                onPress={() => router.push('/faq')}
              >
                <View style={styles.quickIconBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#1d4ed8" />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  FAQ
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Removed bottom tint overlay (was causing pink haze above tab bar). */}

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
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWrap: {
    flex: 1,
    paddingRight: 12,
  },
  brandTagline: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '400',
    color: '#8a8a9e',
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
  categoriesGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  categoryItemBig: {
    width: (width - 20 * 2 - 14) / 2,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eef5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  categoryIconBig: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryNameBig: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
    lineHeight: 18,
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
    paddingRight: 0,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 24,
    marginBottom: 6,
  },
  bannerEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1d4ed8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: 320,
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
    width: 0,
    height: 0,
    borderRadius: 0,
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

  /* ── News ── */
  newsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  newsCard: {
    width: width * 0.72,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  newsImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#e8eef5',
    resizeMode: 'cover',
  },
  newsBody: {
    padding: 14,
  },
  newsSource: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 19,
  },

  /* ── Quick actions ── */
  quickGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickItem: {
    width: (width - 20 * 2 - 14 * 2) / 3,
    alignItems: 'center',
    gap: 8,
  },
  quickIconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8eef5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* ── Bottom Gradient ── */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
  },
});
