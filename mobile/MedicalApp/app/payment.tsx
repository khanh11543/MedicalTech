import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

const paymentMethods = [
  { id: 'visa', label: 'Visa ****4242', icon: 'card-outline' as const },
  { id: 'master', label: 'Mastercard ****8888', icon: 'card-outline' as const },
  { id: 'momo', label: 'MoMo Wallet', icon: 'wallet-outline' as const },
];

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctor: string;
    specialty: string;
    date: string;
    time: string;
    image: string;
  }>();

  const doctor = params.doctor || 'Dr. Emily Johnson';
  const specialty = params.specialty || 'Neurologist';
  const date = params.date || '08 May 2025';
  const time = params.time || 'at 5.30 pm';
  const image = params.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face';

  const [selectedMethod, setSelectedMethod] = useState('visa');

  const handlePay = () => {
    Alert.alert(
      'Payment Successful',
      'Your appointment has been confirmed!',
      [
        {
          text: 'View Appointments',
          onPress: () => router.replace('/my-appointments'),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#d6e4f0', '#e8eef5']} style={styles.topGradient} />
      <LinearGradient colors={['#f5dce8', '#ecc8d8']} style={styles.bottomGradient} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Order Summary</Text>

            <View style={styles.doctorRow}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: image }} style={styles.avatar} />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor}</Text>
                <Text style={styles.doctorSpecialty}>{specialty}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#5b9bd5" />
              <Text style={styles.detailText}>{date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#5b9bd5" />
              <Text style={styles.detailText}>{time}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Consultation Fee</Text>
              <Text style={styles.priceValue}>$29</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>$1</Text>
            </View>
            <View style={[styles.divider, { marginVertical: 10 }]} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>$30</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={method.icon}
                  size={22}
                  color={selectedMethod === method.id ? '#5b9bd5' : '#8a8a9e'}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === method.id && styles.methodLabelSelected,
                  ]}
                >
                  {method.label}
                </Text>
                <View
                  style={[
                    styles.radio,
                    selectedMethod === method.id && styles.radioSelected,
                  ]}
                >
                  {selectedMethod === method.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.payBtnWrapper}
            onPress={handlePay}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#5b9bd5', '#4a8ec4']}
              style={styles.payBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Pay $30</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 30 },

  /* Summary Card */
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d4e6f6',
    marginRight: 12,
  },
  avatar: { width: '100%', height: '100%' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  doctorSpecialty: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e8eef5', marginVertical: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailText: { fontSize: 14, color: '#6b7280' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: { fontSize: 14, color: '#6b7280' },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#5b9bd5' },

  /* Payment Methods */
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  methodsList: { gap: 10, marginBottom: 20 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e8eef5',
    gap: 12,
  },
  methodCardSelected: { borderColor: '#5b9bd5', backgroundColor: '#f0f7ff' },
  methodLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#6b7280' },
  methodLabelSelected: { color: '#1a1a2e', fontWeight: '600' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d0dbe8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#5b9bd5' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#5b9bd5' },

  /* Bottom */
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d0dbe8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  payBtnWrapper: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRadius: 24,
  },
  payBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
