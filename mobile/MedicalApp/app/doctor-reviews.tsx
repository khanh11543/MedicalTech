import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError } from '@/services/apiClient';
import { fetchDoctorReviewsPublic, type PublicReviewDto } from '@/services/appointmentApi';
import { resolveBackendAbsoluteUrl } from '@/constants/api';

const PAGE_SIZE = 20;

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

export default function DoctorReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string; name?: string }>();
  const doctorId = params.doctorId ? Number(params.doctorId) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PublicReviewDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      setError('Invalid doctor.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDoctorReviewsPublic(doctorId, 0, PAGE_SIZE);
      setItems(res.content ?? []);
      setTotal(res.totalElements ?? (res.content?.length ?? 0));
      setPage(0);
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof ApiError ? e.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canLoadMore = items.length < total;

  const loadMore = async () => {
    if (!canLoadMore || loadingMore) return;
    if (!Number.isFinite(doctorId) || doctorId <= 0) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await fetchDoctorReviewsPublic(doctorId, next, PAGE_SIZE);
      const chunk = res.content ?? [];
      setItems((prev) => [...prev, ...chunk]);
      setPage(next);
      setTotal(res.totalElements ?? total);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  const title = useMemo(() => (params.name?.trim() ? `${params.name} reviews` : 'All reviews'), [params.name]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn} activeOpacity={0.85}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.hint}>No published reviews yet.</Text>
              </View>
            ) : (
              items.map((review) => (
                <View key={review.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>{(review.patientName || 'A').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {review.patientName || 'Anonymous'}
                      </Text>
                      <Text style={styles.date}>{formatReviewDate(review.createdAt)}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#fff" />
                      <Text style={styles.ratingText}>{review.rating}</Text>
                    </View>
                  </View>

                  {review.comment?.trim() ? <Text style={styles.body}>{stripHtml(review.comment)}</Text> : null}

                  {review.imageUrls && review.imageUrls.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      {review.imageUrls.map((u, idx) => {
                        const uri = resolveBackendAbsoluteUrl(u) ?? u;
                        return <Image key={`${review.id}-${idx}`} source={{ uri }} style={styles.thumb} />;
                      })}
                    </ScrollView>
                  ) : null}
                </View>
              ))
            )}

            {canLoadMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.85} disabled={loadingMore}>
                {loadingMore ? <ActivityIndicator size="small" color="#fff" /> : null}
                <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
              </TouchableOpacity>
            ) : null}

            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { marginTop: 10, fontSize: 14, color: '#8a8a9e', textAlign: 'center' },
  errorText: { color: '#c0392b', textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#1a1a2e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '900', color: '#1a1a2e' },
  name: { fontSize: 14, fontWeight: '900', color: '#1a1a2e' },
  date: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#5b9bd5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  body: { fontSize: 13, color: '#374151', lineHeight: 19, marginBottom: 10 },
  thumb: { width: 92, height: 72, borderRadius: 12, backgroundColor: '#e8eef5' },
  loadMoreBtn: {
    marginTop: 6,
    backgroundColor: '#5b9bd5',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadMoreText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});

