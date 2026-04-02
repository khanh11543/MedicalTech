import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApiError } from '@/services/apiClient';
import { fetchPublicSpecialties, type SpecialtyDto } from '@/services/dashboardApi';
import { pickSpecialtyIcon } from '@/lib/medicalIcons';

export default function SpecialtiesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SpecialtyDto[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPublicSpecialties();
      setItems(list);
    } catch (e) {
      setItems([]);
      setError(e instanceof ApiError ? e.message : 'Could not load specialties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const title = useMemo(() => `Specialties${items.length > 0 ? ` (${items.length})` : ''}`, [items.length]);

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
              <Text style={styles.hint}>No specialties are available.</Text>
            ) : (
              <View style={styles.grid}>
                {items.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/specialty-detail',
                        params: { specialtyId: String(s.id), name: s.name },
                      })
                    }
                  >
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons name={pickSpecialtyIcon(s.name)} size={28} color="#5b9bd5" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.name} numberOfLines={2}>
                        {s.name}
                      </Text>
                      {s.description?.trim() ? (
                        <Text style={styles.desc} numberOfLines={2}>
                          {s.description.trim()}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ height: 18 }} />
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
  content: { padding: 16, paddingBottom: 32 },
  grid: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '900', color: '#1a1a2e' },
  desc: { marginTop: 4, fontSize: 12, color: '#6b7280', lineHeight: 16 },
});

