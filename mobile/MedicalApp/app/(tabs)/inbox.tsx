import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { authStorage } from '@/lib/authStorage';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/auth';
import {
  fetchPatientDashboardStats,
  fetchPatientProfile,
  type PatientProfile,
  type PatientDashboardStats,
} from '@/services/dashboardApi';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

const menuItems = [
  { label: 'Personal Info', icon: 'person-outline' as const, route: '/edit-profile' as const },
  { label: 'Change password', icon: 'key-outline' as const, route: '/change-password' as const },
  { label: 'My Appointment', icon: 'calendar-outline' as const, route: '/my-appointments' as const },
  { label: 'My Doctors', icon: 'people-outline' as const, route: '/my-doctors' as const },
  { label: 'My tests & diagnostics', icon: 'flask-outline' as const, route: '/my-tests' as const },
];

function displayName(profile: PatientProfile | null, fallbackEmail: string | null): string {
  const n = profile?.fullName?.trim();
  if (n) return n;
  if (fallbackEmail) {
    const local = fallbackEmail.split('@')[0];
    if (local) return local;
  }
  return 'Patient';
}

export default function SettingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState<PatientDashboardStats | null>(null);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string>(PLACEHOLDER_AVATAR);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const stored = await authStorage.getUser();
      setStoredEmail(stored?.email ?? null);

      const [prof, dash] = await Promise.all([fetchPatientProfile(), fetchPatientDashboardStats()]);
      setProfile(prof);
      setStats(dash);
      const av = resolveBackendAbsoluteUrl(prof?.avatarUrl) ?? PLACEHOLDER_AVATAR;
      setAvatarUri(av);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not load profile';
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

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      try {
        await authApi.logout();
      } catch {
        /* still clear local session */
      }
      await authStorage.clearSession();
      router.replace('/sign-in');
    } finally {
      setLoggingOut(false);
    }
  };

  const emailShown = profile?.email?.trim() || storedEmail || '—';
  const nameShown = displayName(profile, storedEmail);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerSide} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading profile…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />
            }
          >
            {loadError ? (
              <Text style={styles.bannerError}>{loadError}</Text>
            ) : null}

            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              </View>
              <Text style={styles.userName}>{nameShown}</Text>
              <Text style={styles.userEmail}>{emailShown}</Text>
              {profile?.patientId != null ? (
                <Text style={styles.patientId}>Patient ID · {profile.patientId}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/edit-profile')}
              >
                <LinearGradient
                  colors={['#5b9bd5', '#4a8ec4']}
                  style={styles.editBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="create-outline" size={14} color="#fff" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {stats ? (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.upcomingAppointments ?? 0}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.completedAppointments ?? 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.pendingPayments ?? 0}</Text>
                  <Text style={styles.statLabel}>Pending pay</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.menuList}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.route) router.push(item.route);
                  }}
                >
                  <View style={styles.menuIconBox}>
                    <Ionicons name={item.icon} size={20} color="#5b9bd5" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleLogOut}
                disabled={loggingOut}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name="log-out-outline" size={20} color="#c0392b" />
                </View>
                <Text style={[styles.menuLabel, styles.logoutLabel]}>
                  {loggingOut ? 'Signing out…' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    marginTop: 12,
    fontSize: 14,
    color: '#8a8a9e',
  },
  bannerError: {
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fdecea',
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerSide: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  avatarSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#e8eef5',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#e0e8f0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  userEmail: {
    fontSize: 14,
    color: '#8a8a9e',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  patientId: {
    marginTop: 6,
    fontSize: 12,
    color: '#a0b4c8',
    fontWeight: '500',
  },
  editBtn: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  editBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e8eef5',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5b9bd5',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#8a8a9e',
    textAlign: 'center',
  },

  menuList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  logoutLabel: {
    color: '#c0392b',
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
