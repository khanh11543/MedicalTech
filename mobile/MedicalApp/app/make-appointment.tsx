import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

const timeSlots = [
  '8:30 am', '9:30 am', '10:00 am', '10:30 am',
  '11:45 am', '12:15 pm', '1:30 pm', '2:45 pm',
  '5:00 pm', '6:15 pm', '8:00 pm',
];

export default function MakeAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    specialty: string;
    image: string;
  }>();

  const name = params.name || 'Dr. Emily Johnson';
  const specialty = params.specialty || 'Neurologist';
  const image = params.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face';

  const [selectedDate] = useState('08 May 2025');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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
          <Text style={styles.headerTitle}>Make an Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor Info */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatarWrapper}>
              <Image source={{ uri: image }} style={styles.doctorAvatar} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{name}</Text>
              <Text style={styles.doctorSpecialty}>{specialty}</Text>
            </View>
          </View>

          {/* Choose Date */}
          <Text style={styles.sectionTitle}>Choose Date</Text>
          <TouchableOpacity style={styles.dateBox} activeOpacity={0.7}>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Ionicons name="calendar-outline" size={20} color="#8a8a9e" />
          </TouchableOpacity>

          {/* Available Time */}
          <Text style={styles.sectionTitle}>Available Time</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlot,
                  selectedTime === slot && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(slot)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === slot && styles.timeSlotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity activeOpacity={0.85} style={styles.appointmentBtnWrapper}>
            <LinearGradient
              colors={['#5b9bd5', '#4a8ec4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.appointmentBtn}
            >
              <Text style={styles.appointmentBtnText}>Make an Appointment</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    height: 180,
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 30,
  },

  /* Doctor Card */
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  doctorAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#7dd3c8',
    backgroundColor: '#e8eef5',
    marginRight: 16,
  },
  doctorAvatar: {
    width: '100%',
    height: '100%',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#8a8a9e',
    marginTop: 3,
  },

  /* Section */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },

  /* Date */
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e8eef5',
    marginBottom: 28,
  },
  dateText: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '500',
  },

  /* Time Slots */
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#d0dbe8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  timeSlotSelected: {
    backgroundColor: '#5b9bd5',
    borderColor: '#5b9bd5',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },

  /* Bottom */
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  appointmentBtnWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  appointmentBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 28,
  },
  appointmentBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
