import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const doctors = [
  {
    name: 'Dr. Emily Johnson',
    specialty: 'Neurologist',
    hours: '9.00 am-7.30 pm',
    price: '$29',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
    favorited: true,
  },
  {
    name: 'Dr. William Harris',
    specialty: 'Psychiatrist',
    hours: '10.00 am-5.30 pm',
    price: '$29',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
    favorited: true,
  },
  {
    name: 'Dr. Daniel Collins',
    specialty: 'Cardiologist',
    hours: '8.30 am-7.30 pm',
    price: '$29',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
    favorited: true,
  },
  {
    name: 'Dr. Olivia Brown',
    specialty: 'Urologist',
    hours: '9.00 am-7.30 pm',
    price: '$29',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=200&h=200&fit=crop&crop=face',
    favorited: true,
  },
];

export default function MyDoctorsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top gradient */}
      <LinearGradient
        colors={['#d6e4f0', '#e8eef5']}
        style={styles.topGradient}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={['#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Doctors</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Doctor List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {doctors.map((doc, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({
                pathname: '/doctor-detail',
                params: {
                  name: doc.name,
                  specialty: doc.specialty,
                  hours: doc.hours,
                  price: doc.price,
                  rating: String(doc.rating),
                  image: doc.image,
                },
              })}
            >
              {/* Avatar with rating badge */}
              <View style={styles.avatarColumn}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: doc.image }} style={styles.avatar} />
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={10} color="#fff" />
                  <Text style={styles.ratingText}>{doc.rating}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoColumn}>
                <View style={styles.nameRow}>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                  <Ionicons
                    name={doc.favorited ? 'star' : 'star-outline'}
                    size={18}
                    color="#3b82f6"
                  />
                </View>
                <Text style={styles.specialty}>{doc.specialty}</Text>

                <View style={styles.scheduleRow}>
                  <Ionicons name="time-outline" size={14} color="#5b9bd5" />
                  <Text style={styles.scheduleText}>{doc.hours}</Text>
                  <Text style={styles.price}>{doc.price}</Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonsRow}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({
                    pathname: '/make-appointment',
                    params: { name: doc.name, specialty: doc.specialty, image: doc.image },
                  })}>
                    <LinearGradient
                      colors={['#5b9bd5', '#4a8ec4']}
                      style={styles.appointmentBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.appointmentBtnText}>Appointment</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageBtn} activeOpacity={0.7}>
                    <Text style={styles.messageBtnText}>Send Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  /* Avatar */
  avatarColumn: {
    alignItems: 'center',
    marginRight: 14,
  },
  avatarWrapper: {
    width: 85,
    height: 85,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#d4e6f6',
    backgroundColor: '#e8eef5',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
    marginTop: -12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  /* Info */
  infoColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 8,
  },
  specialty: {
    fontSize: 13,
    color: '#8a8a9e',
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  scheduleText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  /* Buttons */
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentBtn: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  appointmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  messageBtn: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.2,
    borderColor: '#d0dbe8',
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
  },
});
