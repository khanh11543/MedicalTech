import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type NotificationType = 'bell' | 'confirmed' | 'rejected';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'bell',
    title: 'Your blood test is ready',
    body: 'I received of excellent services from the staff. They listened to my concerns..',
    date: '08 May 2025 at 4.30 pm',
    read: false,
  },
  {
    id: '2',
    type: 'confirmed',
    title: 'Your appointment is confirmed',
    body: 'I received of excellent services from the staff. They listened to my concerns..',
    date: '08 May 2025 at 4.30 pm',
    read: false,
  },
  {
    id: '3',
    type: 'rejected',
    title: 'Your Appointment is rejected',
    body: 'I received of excellent services from the staff. They listened to my concerns..',
    date: '08 May 2025 at 4.30 pm',
    read: false,
  },
];

const iconForType = (type: NotificationType) => {
  switch (type) {
    case 'confirmed':
      return 'checkbox-outline' as const;
    case 'rejected':
      return 'notifications-outline' as const;
    default:
      return 'notifications-outline' as const;
  }
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
              }}
              style={styles.userAvatar}
            />
          </View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color="#1a1a2e" />
          </TouchableOpacity>
        </View>

        {/* ── List ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.map((item) => (
            <View
              key={item.id}
              style={[styles.card, item.read && styles.cardRead]}
            >
              {/* Icon + Title */}
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name={iconForType(item.type)} size={20} color="#fff" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>

              {/* Body */}
              <Text style={styles.cardBody}>{item.body}</Text>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{item.date}</Text>
                {!item.read && (
                  <TouchableOpacity
                    style={styles.markReadBtn}
                    onPress={() => markAsRead(item.id)}
                  >
                    <Text style={styles.markReadText}>Mark as read</Text>
                    <Ionicons name="mail-outline" size={16} color="#1a1a2e" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom gradient */}
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
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    fontWeight: '700',
    color: '#1a1a2e',
  },

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
  cardRead: {
    opacity: 0.6,
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
    backgroundColor: '#5b9bd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  cardBody: {
    fontSize: 13,
    color: '#8a8a9e',
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
    color: '#5b9bd5',
    fontWeight: '500',
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
    height: 60,
  },
});
