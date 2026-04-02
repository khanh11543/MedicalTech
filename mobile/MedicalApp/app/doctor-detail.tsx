import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';
import {
  fetchDoctorDetailPublic,
  fetchDoctorReviewsPublic,
  type DoctorDetailPublic,
  type PublicReviewDto,
} from '@/services/appointmentApi';
import { formatConsultationFee, ratingNum } from '@/lib/doctorPresentation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PLACEHOLDER_DOCTOR =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';

const REVIEW_PREVIEW_SIZE = 5;

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildOverviewText(d: DoctorDetailPublic | null): string {
  if (!d) return '';
  const parts: string[] = [];
  if (d.bio?.trim()) parts.push(stripHtml(d.bio.trim()));
  if (d.education?.trim()) {
    parts.push(`Education: ${stripHtml(d.education.trim())}`);
  }
  if (d.experienceYears != null && d.experienceYears >= 0) {
    parts.push(`${d.experienceYears} years of clinical experience.`);
  }
  if (d.hospitalAffiliation?.trim()) {
    parts.push(`Hospital / affiliation: ${stripHtml(d.hospitalAffiliation.trim())}`);
  }
  if (d.officeAddress?.trim()) {
    parts.push(`Office: ${stripHtml(d.officeAddress.trim())}`);
  }
  if (d.licenseNumber?.trim()) {
    parts.push(`License: ${d.licenseNumber.trim()}`);
  }
  return parts.join('\n\n');
}

function formatReviewDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function locationSubtitle(d: DoctorDetailPublic | null): string {
  if (!d) return '';
  const bits = [d.hospitalAffiliation, d.officeAddress].filter((x) => x?.trim());
  return bits.map((x) => stripHtml(x!.trim())).join(' · ');
}

export default function DoctorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctorId?: string;
    specialtyId?: string;
    name: string;
    specialty: string;
    hours: string;
    price: string;
    rating: string;
    image: string;
  }>();

  const doctorIdNum = params.doctorId ? parseInt(params.doctorId, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DoctorDetailPublic | null>(null);
  const [reviews, setReviews] = useState<PublicReviewDto[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);

  const load = useCallback(async () => {
    if (!Number.isFinite(doctorIdNum) || doctorIdNum <= 0) {
      setLoadError('Invalid doctor.');
      setLoading(false);
      setDetail(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [doc, revPage] = await Promise.all([
        fetchDoctorDetailPublic(doctorIdNum),
        fetchDoctorReviewsPublic(doctorIdNum, 0, REVIEW_PREVIEW_SIZE),
      ]);
      setDetail(doc);
      setReviews(revPage.content ?? []);
      setReviewTotal(revPage.totalElements ?? (revPage.content?.length ?? 0));
    } catch (e) {
      setDetail(null);
      setReviews([]);
      setReviewTotal(0);
      setLoadError(e instanceof ApiError ? e.message : 'Could not load doctor profile.');
    } finally {
      setLoading(false);
    }
  }, [doctorIdNum]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAllReviews = () => {
    router.push({
      pathname: '/doctor-reviews',
      params: { doctorId: String(doctorIdNum), name },
    });
  };

  const name = detail?.fullName?.trim() || params.name || 'Doctor';
  const specialty =
    detail?.primarySpecialty?.trim() ||
    params.specialty ||
    detail?.specialties?.[0]?.name ||
    '';
  const hours =
    locationSubtitle(detail)?.trim() ||
    params.hours ||
    'Schedule available when booking';
  const price = detail
    ? formatConsultationFee(detail.consultationFee)
    : params.price || '—';
  const rating = detail ? ratingNum(detail.ratingAvg) : parseFloat(params.rating || '0');
  const ratingCount = detail?.ratingCount ?? 0;
  const image =
    resolveBackendAbsoluteUrl(detail?.avatarUrl) ??
    (params.image?.startsWith('http') ? params.image : undefined) ??
    PLACEHOLDER_DOCTOR;

  const overviewBody = buildOverviewText(detail);
  const overviewDisplay =
    overviewBody.trim() ||
    'No detailed overview has been added for this doctor yet. You can still book a consultation and see ratings from other patients below.';

  const canOpenAllReviews = reviewTotal > REVIEW_PREVIEW_SIZE;

  if (!Number.isFinite(doctorIdNum) || doctorIdNum <= 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnInline}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <View style={styles.centered}>
            <Text style={styles.errorBanner}>Missing doctor information.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Removed bottom tint overlay (was causing pink haze). */}

      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnInline}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <ActivityIndicator size="large" color="#5b9bd5" style={{ marginTop: 40 }} />
            <Text style={styles.loadingHint}>Loading profile…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.loadingWrap}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnInline}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.errorBanner}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={['#d6e4f0', '#e0ecf5']}
                  style={styles.heroBg}
                />

                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
                </TouchableOpacity>

                <View style={styles.imageContainer}>
                  <View style={styles.tealCircle} />
                  <Image source={{ uri: image }} style={styles.doctorImage} />
                </View>

                <TouchableOpacity style={styles.favoriteBtn}>
                  <Ionicons name="star-outline" size={22} color="#c0c8d4" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.nameRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>{name}</Text>
                    <Text style={styles.specialty}>{specialty}</Text>
                  </View>
                  <Text style={styles.price}>{price}</Text>
                </View>

                <View style={styles.scheduleRatingRow}>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="location-outline" size={15} color="#5b9bd5" />
                    <Text style={styles.scheduleText} numberOfLines={2}>
                      {hours}
                    </Text>
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={14}
                        color={i <= Math.round(rating) ? '#f97316' : '#d1d5db'}
                      />
                    ))}
                    <Text style={styles.ratingNum}>
                      {rating > 0 ? rating.toFixed(1) : '—'}
                      {ratingCount > 0 ? ` (${ratingCount})` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <Text style={styles.overviewText}>{overviewDisplay}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>
                    Reviews{reviewTotal > 0 ? ` (${reviewTotal})` : ''}
                  </Text>
                  {canOpenAllReviews ? (
                    <TouchableOpacity
                      style={styles.viewAllBtn}
                      onPress={openAllReviews}
                    >
                      <Text style={styles.viewAllText}>All reviews</Text>
                      <Ionicons name="chevron-forward" size={14} color="#5b9bd5" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {reviews.length === 0 ? (
                  <Text style={styles.emptyReviews}>No published reviews yet.</Text>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAvatarFallback}>
                          <Text style={styles.reviewAvatarLetter}>
                            {(review.patientName || 'A').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.reviewerName} numberOfLines={1}>
                          {review.patientName || 'Anonymous'}
                        </Text>
                        <View style={styles.reviewRatingBadge}>
                          <Ionicons name="star" size={10} color="#fff" />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                      {review.comment?.trim() ? (
                        <Text style={styles.reviewText}>{stripHtml(review.comment)}</Text>
                      ) : null}
                      {review.imageUrls && review.imageUrls.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {review.imageUrls.map((u, idx) => {
                            const uri = resolveBackendAbsoluteUrl(u) ?? u;
                            return (
                              <Image
                                key={`${review.id}-${idx}`}
                                source={{ uri }}
                                style={styles.reviewThumb}
                              />
                            );
                          })}
                        </ScrollView>
                      ) : null}
                      <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.appointmentBtnWrapper}
                onPress={() =>
                  router.push({
                    pathname: '/make-appointment',
                    params: {
                      doctorId: String(doctorIdNum),
                      ...(params.specialtyId ? { specialtyId: params.specialtyId } : {}),
                      name,
                      specialty,
                      image: params.image || image,
                    },
                  })
                }
              >
                <LinearGradient
                  colors={['#5b9bd5', '#4a8ec4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.appointmentBtn}
                >
                  <Text style={styles.appointmentBtnText}>Make an Appointment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingWrap: { flex: 1, paddingHorizontal: 24 },
  loadingHint: { marginTop: 12, textAlign: 'center', color: '#8a8a9e', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorBanner: { color: '#c0392b', fontSize: 14, textAlign: 'center', marginTop: 16 },
  retryBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#5b9bd5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  backBtnInline: { marginTop: 8, width: 40, height: 40, justifyContent: 'center' },

  heroSection: {
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  tealCircle: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    backgroundColor: '#7dd3c8',
  },
  doctorImage: {
    width: SCREEN_WIDTH * 0.48,
    height: SCREEN_WIDTH * 0.55,
    resizeMode: 'cover',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.2,
    borderBottomRightRadius: SCREEN_WIDTH * 0.2,
  },
  favoriteBtn: {
    position: 'absolute',
    top: SCREEN_WIDTH * 0.45,
    right: 30,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  specialty: {
    fontSize: 14,
    color: '#8a8a9e',
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    maxWidth: '42%',
    textAlign: 'right',
  },
  scheduleRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    flex: 1,
    maxWidth: '58%',
  },
  scheduleText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#e8eef5',
    marginHorizontal: 24,
    marginVertical: 18,
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    fontStyle: 'italic',
  },
  overviewText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginTop: 10,
  },

  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#5b9bd5',
    fontWeight: '500',
  },
  emptyReviews: {
    fontSize: 14,
    color: '#8a8a9e',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#e8eef5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b9bd5',
  },
  reviewerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  reviewRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  reviewText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f4f8',
  },
  reviewDate: {
    fontSize: 12,
    color: '#5b9bd5',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  appointmentBtnWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  appointmentBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 28,
  },
  appointmentBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
