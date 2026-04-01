import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
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
  fetchPatientProfile,
  fetchPublicSpecialties,
  fetchGuideContents,
  fetchPublicDoctorsPage,
  type DoctorCardDto,
  type PublicContentDto,
  type SpecialtyDto,
} from '@/services/dashboardApi';
import { formatConsultationFee, ratingNum, doctorHoursLabel } from '@/lib/doctorPresentation';
import { pickSpecialtyIcon, pickContentTitleIcon } from '@/lib/medicalIcons';

const { width } = Dimensions.get('window');
const GRID_GAP = 14;
const GRID_PADDING = 20;
const CARD_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

const PLACEHOLDER_USER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face';
const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

const SEARCH_DEBOUNCE_MS = 400;

export default function SearchScreen() {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userAvatar, setUserAvatar] = useState(PLACEHOLDER_USER);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<SpecialtyDto[]>([]);
  const [contents, setContents] = useState<PublicContentDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [specialtyFilterId, setSpecialtyFilterId] = useState<number | null>(null);

  const [doctors, setDoctors] = useState<DoctorCardDto[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const isFirstTabLoad = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadDoctors = useCallback(async (q: string, specialtyId: number | null) => {
    setDoctorsLoading(true);
    try {
      const list = await fetchPublicDoctorsPage({
        q: q || undefined,
        specialtyId: specialtyId ?? undefined,
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'ratingAvg',
        sortOrder: 'desc',
      });
      setDoctors(list);
    } catch {
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const fetchStatic = useCallback(async () => {
    const [profile, specs, guides] = await Promise.all([
      fetchPatientProfile(),
      fetchPublicSpecialties(),
      fetchGuideContents(8),
    ]);
    setUserAvatar(resolveBackendAbsoluteUrl(profile?.avatarUrl) ?? PLACEHOLDER_USER);
    setSpecialties(specs);
    setContents(guides);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (isFirstTabLoad.current) setLoading(true);
      setLoadError(null);
      fetchStatic()
        .then(() => {
          if (!cancelled) {
            setLoading(false);
            isFirstTabLoad.current = false;
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setLoadError(e instanceof ApiError ? e.message : 'Failed to load search data');
            setLoading(false);
            isFirstTabLoad.current = false;
          }
        });
      return () => {
        cancelled = true;
      };
    }, [fetchStatic])
  );

  useEffect(() => {
    loadDoctors(debouncedQuery, specialtyFilterId);
  }, [debouncedQuery, specialtyFilterId, loadDoctors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      await fetchStatic();
      await loadDoctors(debouncedQuery, specialtyFilterId);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [fetchStatic, loadDoctors, debouncedQuery, specialtyFilterId]);

  const toggleSpecialtyFilter = (id: number) => {
    setSpecialtyFilterId((prev) => (prev === id ? null : id));
  };

  const openDoctor = (d: DoctorCardDto) => {
    const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
    router.push({
      pathname: '/doctor-detail',
      params: {
        doctorId: String(d.id),
        ...(specialtyFilterId != null ? { specialtyId: String(specialtyFilterId) } : {}),
        name: d.fullName,
        specialty: d.primarySpecialty ?? d.specialties?.[0] ?? '',
        hours: doctorHoursLabel(d),
        price: formatConsultationFee(d.consultationFee),
        rating: String(ratingNum(d.ratingAvg)),
        image: img,
      },
    });
  };

  const activeFilterName =
    specialtyFilterId != null ? specialties.find((s) => s.id === specialtyFilterId)?.name : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.loadingHint}>Loading…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5b9bd5']} />
            }
          >
            {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setDrawerVisible(true)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
                </View>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Search</Text>
              <TouchableOpacity onPress={() => router.push('/filters')}>
                <Ionicons name="options-outline" size={26} color="#1a1a2e" />
              </TouchableOpacity>
            </View>

            {/* Search field */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color="#8a8a9e" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search doctors, hospital, city…"
                placeholderTextColor="#a8a8b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12}>
                  <Ionicons name="close-circle" size={20} color="#c0c8d4" />
                </TouchableOpacity>
              ) : null}
            </View>

            {(debouncedQuery || specialtyFilterId != null) && activeFilterName ? (
              <Text style={styles.filterHint}>
                Specialty: {activeFilterName}
                {debouncedQuery ? ` · “${debouncedQuery}”` : ''}
              </Text>
            ) : null}

            {/* Doctors (API) */}
            <View style={styles.doctorsSectionHead}>
              <Text style={styles.sectionTitleNoPad}>Doctors</Text>
              {doctorsLoading ? <ActivityIndicator size="small" color="#5b9bd5" /> : null}
            </View>
            {doctors.length === 0 && !doctorsLoading ? (
              <Text style={styles.mutedPadded}>No doctors match your search. Try another keyword.</Text>
            ) : (
              <View style={styles.doctorList}>
                {doctors.map((d) => {
                  const img = resolveBackendAbsoluteUrl(d.avatarUrl) ?? PLACEHOLDER_DOCTOR;
                  const r = ratingNum(d.ratingAvg);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.doctorRow}
                      onPress={() => openDoctor(d)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: img }} style={styles.doctorRowAvatar} />
                      <View style={styles.doctorRowBody}>
                        <Text style={styles.doctorRowName} numberOfLines={1}>
                          {d.fullName}
                        </Text>
                        <Text style={styles.doctorRowSpec} numberOfLines={1}>
                          {d.primarySpecialty ?? d.specialties?.[0] ?? ''}
                        </Text>
                        <Text style={styles.doctorRowMeta} numberOfLines={1}>
                          {doctorHoursLabel(d)} · {formatConsultationFee(d.consultationFee)}
                        </Text>
                      </View>
                      {r > 0 ? (
                        <View style={styles.doctorRowRating}>
                          <FontAwesome name="star" size={11} color="#ff6b35" />
                          <Text style={styles.doctorRowRatingText}>{r}</Text>
                        </View>
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Specialties grid */}
            <Text style={styles.sectionTitle}>Browse by specialty</Text>
            {specialties.length === 0 ? (
              <Text style={styles.mutedPadded}>No specialties are available.</Text>
            ) : (
              <View style={styles.grid}>
                {specialties.map((cat) => {
                  const selected = specialtyFilterId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.gridCard, selected && styles.gridCardSelected]}
                      onPress={() => toggleSpecialtyFilter(cat.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.gridIconWrapper, selected && styles.gridIconWrapperSelected]}>
                        <MaterialCommunityIcons
                          name={pickSpecialtyIcon(cat.name)}
                          size={32}
                          color={selected ? '#fff' : '#5b9bd5'}
                        />
                      </View>
                      <Text style={styles.gridLabel} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {specialtyFilterId != null ? (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSpecialtyFilterId(null)}>
                <Text style={styles.clearFilterText}>Clear specialty filter</Text>
              </TouchableOpacity>
            ) : null}

            {/* Guides / resources */}
            <Text style={styles.sectionTitle}>Diagnostics & tests</Text>
            {contents.length === 0 ? (
              <Text style={styles.mutedPadded}>No guides or articles yet.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.diagnosticsRow}
              >
                {contents.map((item, idx) => {
                  const dark = idx % 2 === 1;
                  const label = item.title.replace(/\s+/g, '\n').slice(0, 36);
                  return (
                    <TouchableOpacity key={item.id} style={styles.diagnosticCard} activeOpacity={0.85}>
                      <View style={[styles.diagnosticIconBox, dark && styles.diagnosticIconDark]}>
                        <MaterialCommunityIcons
                          name={pickContentTitleIcon(item.title)}
                          size={30}
                          color={dark ? '#fff' : '#5b9bd5'}
                        />
                      </View>
                      <Text style={styles.diagnosticName}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

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
  mutedPadded: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: 10,
    color: '#8a8a9e',
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#e0e8f0',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: GRID_PADDING,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8ecf2',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
    paddingVertical: 2,
  },
  filterHint: {
    marginHorizontal: GRID_PADDING,
    marginBottom: 8,
    fontSize: 12,
    color: '#5b9bd5',
    fontWeight: '500',
  },

  doctorsSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitleNoPad: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: GRID_PADDING,
    marginTop: 18,
    marginBottom: 12,
  },

  doctorList: {
    paddingHorizontal: GRID_PADDING,
    gap: 10,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  doctorRowAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  doctorRowBody: {
    flex: 1,
    minWidth: 0,
  },
  doctorRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  doctorRowSpec: {
    fontSize: 13,
    color: '#8a8a9e',
    marginTop: 2,
  },
  doctorRowMeta: {
    fontSize: 11,
    color: '#5b9bd5',
    marginTop: 4,
  },
  doctorRowRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff5f0',
    borderRadius: 8,
  },
  doctorRowRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridCardSelected: {
    borderColor: '#5b9bd5',
    backgroundColor: '#f0f7fc',
  },
  gridIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridIconWrapperSelected: {
    backgroundColor: '#5b9bd5',
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  clearFilterBtn: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b9bd5',
  },

  diagnosticsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  diagnosticCard: {
    alignItems: 'center',
    width: 100,
  },
  diagnosticIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  diagnosticIconDark: {
    backgroundColor: '#1a1a2e',
  },
  diagnosticName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1a1a2e',
    textAlign: 'center',
    lineHeight: 15,
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
