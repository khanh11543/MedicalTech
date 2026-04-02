import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authStorage } from '@/lib/authStorage';
import { authApi } from '@/services/auth';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { fetchPatientProfile } from '@/services/dashboardApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;
const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face';

const menuItems = [
  { label: 'FAQ', route: '/faq' as const },
  { label: 'Help & Support', route: '/help-support' as const },
  { label: 'Privacy Policy', route: '/privacy-policy' as const },
];

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [loggingOut, setLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(PLACEHOLDER_AVATAR);

  const displayName = useMemo(() => userName || 'Account', [userName]);
  const displayEmail = useMemo(() => userEmail || '—', [userEmail]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, translateX]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const u = await authStorage.getUser();
      setUserEmail(u?.email ?? null);
      try {
        const profile = await fetchPatientProfile();
        setUserName(profile?.fullName?.trim() || null);
        setAvatarUrl(resolveBackendAbsoluteUrl(profile?.avatarUrl) ?? PLACEHOLDER_AVATAR);
        if (!u?.email && profile?.email) setUserEmail(profile.email);
      } catch {
        setUserName(null);
        setAvatarUrl(PLACEHOLDER_AVATAR);
      }
    })();
  }, [visible]);

  const handleLogout = async () => {
    if (loggingOut) return;
    Alert.alert('Logout', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await authApi.logout();
          } catch {
            // ignore network/server failure, still clear local session
          } finally {
            await authStorage.clearSession();
            await authStorage.clearPendingMfa();
            onClose();
            router.replace('/sign-in');
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* Close button */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="chevron-down" size={24} color="#1a1a2e" />
        </TouchableOpacity>

        <View style={styles.drawerBody}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
            {/* User info */}
            <View style={styles.userSection}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userEmail}>{displayEmail}</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutIconBtn}
                activeOpacity={0.75}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/search');
                }}
              >
                <LinearGradient
                  colors={['#5b9bd5', '#7ab8e0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.searchGradient}
                >
                  <Ionicons name="search" size={18} color="#fff" />
                  <Text style={styles.searchPlaceholder}>Search</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Menu items */}
            <View style={styles.menuList}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    router.push(item.route);
                  }}
                >
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom close arrow */}
          <View style={styles.bottomCloseWrap}>
            <TouchableOpacity style={styles.bottomCloseBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.bottomCloseText}>Close</Text>
              <Ionicons name="arrow-forward" size={16} color="#1a1a2e" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingTop: 54,
    paddingHorizontal: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  drawerBody: {
    flex: 1,
  },
  drawerScroll: {
    paddingBottom: 12,
  },
  bottomCloseWrap: {
    paddingTop: 10,
    paddingBottom: 18,
    alignItems: 'center',
  },
  bottomCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8eef5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bottomCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
  },

  /* Close */
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

  /* User */
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e8f0',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1d5d5',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  userEmail: {
    fontSize: 12,
    color: '#8a8a9e',
    marginTop: 2,
  },

  /* Search */
  searchBar: {
    marginBottom: 28,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },

  /* Menu */
  menuList: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8eef5',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
  },
});
