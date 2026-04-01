import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

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
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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
          toValue: -DRAWER_WIDTH,
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
  }, [visible]);

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

        {/* User info */}
        <View style={styles.userSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Rason Battler</Text>
            <Text style={styles.userEmail}>rasonbattlers@gmail.com</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <LinearGradient
            colors={['#5b9bd5', '#7ab8e0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.searchPlaceholder}>Search</Text>
          </LinearGradient>
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
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 54,
    paddingHorizontal: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
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
