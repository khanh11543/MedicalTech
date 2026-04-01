import React from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const menuItems = [
  { label: 'Personal Info', icon: 'person-outline' as const, lib: 'ionicons' as const, route: null },
  { label: 'My Appointment', icon: 'calendar-outline' as const, lib: 'ionicons' as const, route: null },
  { label: 'My Doctors', icon: 'people-outline' as const, lib: 'ionicons' as const, route: '/my-doctors' },
  { label: 'My tests & diagnostics', icon: 'flask-outline' as const, lib: 'ionicons' as const, route: null },
];

export default function SettingScreen() {
  const router = useRouter();

  const handleLogOut = () => {
    router.replace('/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top gradient */}
      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face' }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.userName}>Rason Battler</Text>
            <Text style={styles.userEmail}>Rasonbattler@gmail.com</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuList}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.route) router.push(item.route as any);
                }}
              >
                <View style={styles.menuIconBox}>
                  <Ionicons name={item.icon} size={20} color="#5b9bd5" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
              </TouchableOpacity>
            ))}

            {/* Log Out */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogOut}>
              <View style={styles.menuIconBox}>
                <Ionicons name="log-out-outline" size={20} color="#5b9bd5" />
              </View>
              <Text style={styles.menuLabel}>Log Out</Text>
            </TouchableOpacity>
          </View>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#e8eef5',
    marginBottom: 14,
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
  },
  userEmail: {
    fontSize: 14,
    color: '#8a8a9e',
  },

  /* Menu */
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

  /* Bottom Gradient */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
