import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const upcomingAppointments = [
  {
    id: '1',
    doctor: 'Dr. Emily Johnson',
    specialty: 'Neurologist',
    date: '08',
    month: 'May 25',
    time: 'at 5.30 pm',
    status: 'Confirmed',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
  },
];

const pastAppointments = [
  {
    id: '1',
    doctor: 'Dr. Olivia Brown',
    specialty: 'Urologist',
    date: '12 Sep, Sunday',
    price: '$29',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: '2',
    doctor: 'Dr. William Harris',
    specialty: 'Psychiatrist',
    date: '27 Aug, Tueseday',
    price: '$29',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: '3',
    doctor: 'Dr. Daniel Collins',
    specialty: 'Cardiologist',
    date: '15 Dec, Monday',
    price: '$29',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
  },
];

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState(upcomingAppointments);
  const [selectedApt, setSelectedApt] = useState<typeof upcomingAppointments[0] | null>(null);

  const handleCancel = (apt: typeof upcomingAppointments[0]) => {
    setSelectedApt(apt);
  };

  const confirmCancel = () => {
    if (selectedApt) {
      setUpcoming((prev) => prev.filter((a) => a.id !== selectedApt.id));
    }
    setSelectedApt(null);
  };

  return (
    <View style={styles.container}>
      {/* Top gradient */}
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      {/* Bottom gradient */}
      <LinearGradient colors={['#f5dce8', '#ecc8d8']} style={styles.bottomGradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Upcoming ── */}
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>

          {upcoming.map((apt) => (
            <View key={apt.id} style={styles.upcomingCard}>
              <View style={styles.upcomingRow}>
                {/* Date box */}
                <LinearGradient
                  colors={['#5b9bd5', '#7ab8e0']}
                  style={styles.dateBox}
                >
                  <Text style={styles.dateDay}>{apt.date}</Text>
                  <Text style={styles.dateMonth}>{apt.month}</Text>
                  <View style={styles.dateDivider} />
                  <Text style={styles.dateTime}>{apt.time}</Text>
                </LinearGradient>

                {/* Doctor avatar */}
                <View style={styles.upcomingAvatarWrapper}>
                  <Image source={{ uri: apt.avatar }} style={styles.upcomingAvatar} />
                </View>

                {/* Info */}
                <View style={styles.upcomingInfo}>
                  <View style={styles.upcomingNameRow}>
                    <Text style={styles.upcomingName}>{apt.doctor}</Text>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={18} color="#8a8a9e" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.upcomingSpecialty}>{apt.specialty}</Text>
                  <View style={styles.upcomingStatusRow}>
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                      <Text style={styles.statusText}>{apt.status}</Text>
                    </View>
                    <TouchableOpacity style={styles.chatBtn}>
                      <Text style={styles.chatBtnText}>Chat</Text>
                      <Ionicons name="chatbubble-outline" size={14} color="#5b9bd5" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.upcomingActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(apt)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.payBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/payment',
                    params: {
                      doctor: apt.doctor,
                      specialty: apt.specialty,
                      date: `${apt.date} ${apt.month}`,
                      time: apt.time,
                      image: apt.avatar,
                    },
                  })}
                >
                  <LinearGradient
                    colors={['#5b9bd5', '#4a8ec4']}
                    style={styles.payBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="card-outline" size={16} color="#fff" />
                    <Text style={styles.payBtnText}>Payment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* ── Past ── */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Past Appointments</Text>

          {pastAppointments.map((apt) => (
            <View key={apt.id} style={styles.pastCard}>
              <View style={styles.pastRow}>
                <View style={styles.pastAvatarWrapper}>
                  <Image source={{ uri: apt.avatar }} style={styles.pastAvatar} />
                </View>
                <View style={styles.pastInfo}>
                  <View style={styles.pastNameRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pastName}>{apt.doctor}</Text>
                      <Text style={styles.pastSpecialty}>{apt.specialty}</Text>
                    </View>
                    <Text style={styles.pastPrice}>{apt.price}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pastFooter}>
                <View style={styles.pastDateRow}>
                  <Ionicons name="time-outline" size={14} color="#5b9bd5" />
                  <Text style={styles.pastDateText}>{apt.date}</Text>
                </View>
                <View style={styles.pastActions}>
                  <TouchableOpacity style={styles.leaveReviewBtn} activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/write-review', params: { doctor: apt.doctor, specialty: apt.specialty } })}>
                    <LinearGradient
                      colors={['#5b9bd5', '#4a8ec4']}
                      style={styles.leaveReviewGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.leaveReviewText}>Rating</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.prescriptionBtn} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={14} color="#1a1a2e" />
                    <Text style={styles.prescriptionText}>Prescription</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Cancel Modal ── */}
      <Modal
        visible={selectedApt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedApt(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedApt(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedApt && (
                  <>
                    {/* Doctor info */}
                    <View style={styles.modalDoctorRow}>
                      <View style={styles.modalAvatarWrapper}>
                        <Image source={{ uri: selectedApt.avatar }} style={styles.modalAvatar} />
                      </View>
                      <View style={styles.modalDoctorInfo}>
                        <Text style={styles.modalDoctorName}>{selectedApt.doctor}</Text>
                        <Text style={styles.modalDoctorSpecialty}>{selectedApt.specialty}</Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.modalDetailCard}>
                      <Ionicons name="calendar-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Date</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedApt.date} {selectedApt.month.replace(/\d+/, '').trim()}, Thursday
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailCard}>
                      <Ionicons name="time-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Time</Text>
                        <Text style={styles.modalDetailValue}>{selectedApt.time}</Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailCard}>
                      <Ionicons name="cash-outline" size={18} color="#5b9bd5" />
                      <View style={styles.modalDetailInfo}>
                        <Text style={styles.modalDetailLabel}>Price</Text>
                        <Text style={styles.modalDetailValue}>$29</Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.modalBtnsRow}>
                      <TouchableOpacity
                        style={styles.rescheduleBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedApt(null);
                          router.push({
                            pathname: '/make-appointment',
                            params: {
                              name: selectedApt.doctor,
                              specialty: selectedApt.specialty,
                              image: selectedApt.avatar,
                            },
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#5b9bd5', '#4a8ec4']}
                          style={styles.rescheduleBtnGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.messageModalBtn}
                        activeOpacity={0.7}
                        onPress={() => setSelectedApt(null)}
                      >
                        <Text style={styles.messageModalBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Cancel link */}
                    <TouchableOpacity
                      style={styles.cancelAppointmentLink}
                      onPress={confirmCancel}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelAppointmentText}>Cancel Appointment</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },

  /* ── Upcoming ── */
  upcomingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  upcomingRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    width: 72,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  dateDay: { fontSize: 24, fontWeight: '800', color: '#fff' },
  dateMonth: { fontSize: 12, fontWeight: '500', color: '#fff', marginTop: 1 },
  dateDivider: { width: '70%', height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 5 },
  dateTime: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  upcomingAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 10,
  },
  upcomingAvatar: { width: '100%', height: '100%' },
  upcomingInfo: { flex: 1 },
  upcomingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  upcomingSpecialty: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },
  upcomingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf3fa',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 5,
  },
  chatBtnText: { fontSize: 12, fontWeight: '600', color: '#5b9bd5' },

  upcomingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f8',
    paddingTop: 12,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#fca5a5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 5,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  payBtn: { borderRadius: 18, overflow: 'hidden' },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 5,
    borderRadius: 18,
  },
  payBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  /* ── Past ── */
  pastCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pastRow: { flexDirection: 'row', alignItems: 'center' },
  pastAvatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 12,
  },
  pastAvatar: { width: '100%', height: '100%' },
  pastInfo: { flex: 1 },
  pastNameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pastName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  pastSpecialty: { fontSize: 12, color: '#8a8a9e', marginTop: 2 },
  pastPrice: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },

  pastFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pastDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastDateText: { fontSize: 12, color: '#6b7280' },
  pastActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaveReviewBtn: { borderRadius: 18, overflow: 'hidden' },
  leaveReviewGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  leaveReviewText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#d0dbe8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  prescriptionText: { fontSize: 12, fontWeight: '600', color: '#1a1a2e' },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
  },
  modalDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#7dd3c8',
    marginRight: 14,
  },
  modalAvatar: { width: '100%', height: '100%' },
  modalDoctorInfo: { flex: 1 },
  modalDoctorName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalDoctorSpecialty: { fontSize: 14, color: '#8a8a9e', marginTop: 2 },

  modalDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eef5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  modalDetailInfo: { flex: 1 },
  modalDetailLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  modalDetailValue: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },

  modalBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  rescheduleBtn: { flex: 1, borderRadius: 22, overflow: 'hidden' },
  rescheduleBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 22,
  },
  rescheduleBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  messageModalBtn: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    paddingVertical: 14,
    alignItems: 'center',
  },
  messageModalBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  cancelAppointmentLink: {
    alignSelf: 'center',
    marginTop: 16,
  },
  cancelAppointmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
