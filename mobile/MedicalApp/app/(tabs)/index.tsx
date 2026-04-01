import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import SideDrawer from '@/components/side-drawer';

const { width } = Dimensions.get('window');

// ── Mock Data ──────────────────────────────────────────────
const appointment = {
  doctor: 'Dr. Emily Johnson',
  specialty: 'Neurologist',
  date: '08 May 2025 at 4.30 pm',
  rating: 5.0,
  price: 29,
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
};

const categories = [
  { name: 'Dentistry', icon: 'tooth-outline' as const },
  { name: 'Gynecology', icon: 'human-female' as const },
  { name: 'Cardiology', icon: 'heart-pulse' as const },
  { name: 'Neurology', icon: 'brain' as const },
  { name: 'Orthopedic', icon: 'bone' as const },
];

const diagnostics = [
  { title: 'Genetic Testing', icon: 'dna' as const, desc: 'The team went above & beyond to ensure I felt safe, understood through' },
  { title: 'Cellular and Chemical', icon: 'flask-outline' as const, desc: 'The team went above & beyond to ensure I felt safe, understood through' },
  { title: 'Diagnostic Imaging', icon: 'stethoscope' as const, desc: 'The team went above & beyond to ensure I felt safe, understood through' },
  { title: 'Mesurement', icon: 'tooth-outline' as const, desc: 'The team went above & beyond to ensure I felt safe, understood through' },
];

const topDoctors = [
  { name: 'Dr. William Harris', specialty: 'Psychiatrist', hours: '8.00 am-5.30 pm', rating: 5.0, avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face' },
  { name: 'Dr. Daniel Collins', specialty: 'Cardiologist', hours: '8.30 am-7.30 pm', rating: 5.0, avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face' },
  { name: 'Dr. Olivia Smith', specialty: 'Urologist', hours: '9.00 am-6.00 pm', rating: 5.0, avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=200&h=200&fit=crop&crop=face' },
];

// ── Component ──────────────────────────────────────────────
export default function DashboardScreen() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setDrawerVisible(true)}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face' }}
                  style={styles.userAvatar}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="menu" size={26} color="#1a1a2e" />
            </TouchableOpacity>
          </View>

          {/* ── My Appointments ── */}
          <Text style={styles.sectionTitle}>My Appointments</Text>
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentRow}>
              <View style={styles.doctorAvatarWrapper}>
                <Image source={{ uri: appointment.avatar }} style={styles.doctorAvatar} />
                <View style={styles.ratingBadge}>
                  <FontAwesome name="star" size={10} color="#ff6b35" />
                  <Text style={styles.ratingText}>{appointment.rating}</Text>
                </View>
              </View>
              <View style={styles.appointmentInfo}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.doctorName}>{appointment.doctor}</Text>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={18} color="#8a8a9e" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.specialty}>{appointment.specialty}</Text>
                <Text style={styles.appointmentDate}>{appointment.date}</Text>
                <View style={styles.appointmentActions}>
                  <TouchableOpacity style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Send Message</Text>
                  </TouchableOpacity>
                  <Text style={styles.priceText}>${appointment.price}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Categories ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color="#8a8a9e" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.categoryItem}>
                <View style={styles.categoryIcon}>
                  <MaterialCommunityIcons name={cat.icon} size={28} color="#5b9bd5" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Diagnostics & Tests ── */}
          <Text style={styles.sectionTitle}>Diagnostics & Tests</Text>
          {diagnostics.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.diagnosticCard}>
              <View style={styles.diagnosticIcon}>
                <MaterialCommunityIcons name={item.icon} size={26} color="#5b9bd5" />
              </View>
              <View style={styles.diagnosticInfo}>
                <Text style={styles.diagnosticTitle}>{item.title}</Text>
                <Text style={styles.diagnosticDesc} numberOfLines={2}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#c0c8d4" />
            </TouchableOpacity>
          ))}

          {/* ── Consultation Banner ── */}
          <View style={styles.bannerCard}>
            <LinearGradient
              colors={['#e8eef5', '#dce6f0']}
              style={styles.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerTextArea}>
                  <Text style={styles.bannerTitle}>
                    Book your free consultation with a Neurologist today!
                  </Text>
                  <TouchableOpacity style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Appointment</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=250&fit=crop' }}
                  style={styles.bannerImage}
                />
              </View>
            </LinearGradient>
          </View>

          {/* ── Top Doctors ── */}
          <Text style={styles.sectionTitle}>Top Doctors</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topDoctorsRow}
          >
            {topDoctors.map((doc, idx) => (
              <View key={idx} style={styles.topDoctorCard}>
                <View style={styles.topDoctorImageWrapper}>
                  <Image source={{ uri: doc.avatar }} style={styles.topDoctorImage} />
                  <View style={styles.topDoctorRating}>
                    <FontAwesome name="star" size={9} color="#ff6b35" />
                    <Text style={styles.topDoctorRatingText}>{doc.rating}</Text>
                  </View>
                  <TouchableOpacity style={styles.favoriteIcon}>
                    <Ionicons name="star-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.hoursChip}>
                    <Ionicons name="time-outline" size={11} color="#5b9bd5" />
                    <Text style={styles.hoursText}>{doc.hours}</Text>
                  </View>
                </View>
                <Text style={styles.topDoctorName}>{doc.name}</Text>
                <Text style={styles.topDoctorSpecialty}>{doc.specialty}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={{ height: 30 }} />
        </ScrollView>
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

// ── Styles ─────────────────────────────────────────────────
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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

  /* ── Section ── */
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8a8a9e',
    marginRight: 2,
  },

  /* ── Appointment Card ── */
  appointmentCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  appointmentRow: {
    flexDirection: 'row',
  },
  doctorAvatarWrapper: {
    width: 80,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  doctorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  specialty: {
    fontSize: 13,
    color: '#8a8a9e',
    marginTop: 2,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#5b9bd5',
    marginTop: 6,
  },
  appointmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#5b9bd5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  /* ── Categories ── */
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 78,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#1a1a2e',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* ── Diagnostics ── */
  diagnosticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  diagnosticIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#edf3fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  diagnosticInfo: {
    flex: 1,
    marginRight: 8,
  },
  diagnosticTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  diagnosticDesc: {
    fontSize: 12,
    color: '#8a8a9e',
    lineHeight: 17,
  },

  /* ── Banner ── */
  bannerCard: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  bannerGradient: {
    borderRadius: CARD_RADIUS,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bannerTextArea: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    lineHeight: 24,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#5b9bd5',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerImage: {
    width: 110,
    height: 130,
    borderRadius: 12,
  },

  /* ── Top Doctors ── */
  topDoctorsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  topDoctorCard: {
    width: width * 0.4,
  },
  topDoctorImageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  topDoctorImage: {
    width: '100%',
    height: '100%',
  },
  topDoctorRating: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  topDoctorRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  hoursChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#ffffffdd',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  topDoctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  topDoctorSpecialty: {
    fontSize: 12,
    color: '#8a8a9e',
    marginTop: 2,
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