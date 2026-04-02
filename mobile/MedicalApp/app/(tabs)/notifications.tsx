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
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import SideDrawer from '@/components/side-drawer';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';
import { fetchPatientProfile } from '@/services/dashboardApi';
import {
  fetchMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  type NotificationDTO,
} from '@/services/notificationsApi';

const PLACEHOLDER_USER =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face';

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatNotificationWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function iconForNotification(n: NotificationDTO): React.ComponentProps<typeof Ionicons>['name'] {
  const cat = n.category ?? '';
  if (
    cat === 'APPOINTMENT_CANCELLED' ||
    cat === 'PAYMENT_FAILED' ||
    cat === 'NO_SHOW_MARKED' ||
    cat === 'OVERDUE_PAYMENT'
  ) {
    return 'close-circle-outline';
  }
  if (
    cat === 'NEW_BOOKING' ||
    cat === 'APPOINTMENT_CONFIRMED' ||
    cat === 'MOMO_PAYMENT_RECEIVED' ||
    cat === 'PATIENT_CHECKED_IN'
  ) {
    return 'checkbox-outline';
  }
  switch (n.type) {
    case 'PAYMENT':
      return 'card-outline';
    case 'PATIENT':
      return 'person-outline';
    case 'SYSTEM':
      return 'notifications-outline';
    default:
      return 'calendar-outline';
  }
}

function iconBgForNotification(n: NotificationDTO): string {
  if (n.priority === 'URGENT') return '#e74c3c';
  if (n.type === 'PAYMENT') return '#27ae60';
  if (n.type === 'SYSTEM') return '#9b59b6';
  return '#5b9bd5';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [userAvatar, setUserAvatar] = useState<string>(PLACEHOLDER_USER);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [selected, setSelected] = useState<NotificationDTO | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    setNeedsSignIn(false);
    try {
      const [listRes, profile] = await Promise.all([
        fetchMyNotifications({ pageNumber: 0, pageSize: 40 }),
        fetchPatientProfile(),
      ]);
      setNotifications(listRes.notifications ?? []);
      const av = resolveBackendAbsoluteUrl(profile?.avatarUrl) ?? PLACEHOLDER_USER;
      setUserAvatar(av);
    } catch (e) {
      const unauthorized = e instanceof ApiError && e.status === 401;
      setNeedsSignIn(unauthorized);
      const msg =
        e instanceof ApiError
          ? unauthorized
            ? 'Your session has expired or you are not signed in.'
            : e.message
          : 'Could not load notifications';
      setLoadError(msg);
      if (unauthorized) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const unread = notifications.filter((n) => !n.isRead);
  const visible = tab === 'unread' ? unread : notifications;

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const markAsRead = async (id: number) => {
    setMarkingId(id);
    try {
      await markMyNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not update';
      Alert.alert('Error', msg);
    } finally {
      setMarkingId(null);
    }
  };

  const onPressNotification = async (item: NotificationDTO) => {
    setSelected(item);
    if (!item.isRead) {
      await markAsRead(item.id);
    }
  };

  const onShareSelected = async () => {
    if (!selected) return;
    try {
      await Share.share({
        message: `${selected.title}\n\n${stripHtml(selected.message || '')}`.trim(),
      });
    } catch {
      // user cancelled / platform error
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unread.length === 0) return;
    setMarkingAll(true);
    try {
      await markAllMyNotificationsRead();
      const nowIso = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: nowIso })));
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ width: 40, height: 40 }} />
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} accessibilityRole="button">
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
            onPress={() => setTab('all')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'unread' && styles.tabBtnActive]}
            onPress={() => setTab('unread')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === 'unread' && styles.tabTextActive]}>Unread</Text>
            {unread.length > 0 ? (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unread.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {tab === 'unread' ? (
          <View style={styles.unreadActions}>
            <TouchableOpacity
              style={[styles.markAllBtn, (unread.length === 0 || markingAll) && styles.markAllBtnDisabled]}
              onPress={markAllAsRead}
              disabled={unread.length === 0 || markingAll}
              activeOpacity={0.85}
            >
              {markingAll ? <ActivityIndicator size="small" color="#fff" /> : null}
              <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all as read'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── List ── */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#5b9bd5" />
            <Text style={styles.hint}>Loading notifications…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{loadError}</Text>
            {needsSignIn ? (
              <TouchableOpacity style={styles.retryBtn} onPress={() => router.push('/sign-in')}>
                <Text style={styles.retryBtnText}>Sign in</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)}>
                <Text style={styles.retryBtnText}>Try again</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5b9bd5" />
            }
          >
            {visible.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="notifications-off-outline" size={48} color="#b0b8c4" />
                <Text style={styles.emptyTitle}>
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </Text>
                <Text style={styles.emptySub}>
                  Updates about appointments and payments will appear here.
                </Text>
              </View>
            ) : (
              visible.map((item) => {
                const iconName = iconForNotification(item);
                const iconBg = iconBgForNotification(item);
                const body = stripHtml(item.message || '');
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[
                      styles.card,
                      item.isRead ? styles.cardRead : styles.cardUnread,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => onPressNotification(item)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={20} color="#fff" />
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>

                    <Text style={styles.cardBody}>{body || '—'}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDate}>{formatNotificationWhen(item.createdAt)}</Text>
                      {!item.isRead && (
                        <TouchableOpacity
                          style={[styles.markReadBtn, markingId === item.id && styles.markReadBtnDisabled]}
                          onPress={() => markAsRead(item.id)}
                          disabled={markingId === item.id}
                        >
                          {markingId === item.id ? (
                            <ActivityIndicator size="small" color="#1a1a2e" />
                          ) : (
                            <>
                              <Text style={styles.markReadText}>Mark as read</Text>
                              <Ionicons name="mail-outline" size={16} color="#1a1a2e" />
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelected(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalTopRow}>
                  <View style={styles.modalIconBubble}>
                    <Ionicons name="notifications-outline" size={18} color="#ef4444" />
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} hitSlop={10}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle} numberOfLines={3}>
                  {(selected?.title || 'Notification').toUpperCase()}
                </Text>

                <Text style={styles.modalBody}>
                  {selected ? stripHtml(selected.message || '') : ''}
                </Text>

                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setSelected(null)} activeOpacity={0.85}>
                    <Text style={styles.modalBtnGhostText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalBtnPrimary} onPress={onShareSelected} activeOpacity={0.85}>
                    <Text style={styles.modalBtnPrimaryText}>Share</Text>
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Removed bottom tint overlay (was causing pink haze above tab bar). */}

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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  hint: {
    marginTop: 12,
    fontSize: 14,
    color: '#8a8a9e',
  },
  errorText: {
    fontSize: 15,
    color: '#c0392b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#5b9bd5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    color: '#8a8a9e',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },

  tabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d0d8e0',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
  },
  tabBtnActive: {
    backgroundColor: '#5b9bd5',
    borderColor: '#5b9bd5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  tabTextActive: {
    color: '#fff',
  },
  unreadPill: {
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadPillText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  unreadActions: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  markAllBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtnDisabled: {
    opacity: 0.5,
  },
  markAllText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  /* ── Card ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d0d8e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardUnread: {
    borderColor: '#bcd3ee',
  },
  cardRead: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    flex: 1,
  },
  cardBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d8e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  markReadBtnDisabled: {
    opacity: 0.7,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  /* ── Bottom Gradient ── */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
  },

  /* ── Modal detail ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffe7e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a2e',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnGhost: {
    flex: 1,
    backgroundColor: '#edf3fa',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnGhostText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
});
