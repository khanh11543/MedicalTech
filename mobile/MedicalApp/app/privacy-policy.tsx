import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 */}
          <Text style={styles.sectionTitle}>1. Terms & Conditions</Text>

          <Text style={styles.subHeading}>General Information :</Text>
          <Text style={styles.bodyText}>
            The information provided by this medical service is for general healthcare purposes only
          </Text>

          <Text style={styles.subHeading}>Medical Advice Disclaimer :</Text>
          <Text style={styles.bodyText}>
            Any medical content, advice, or recommendations shared through our platform should be used as guidance.
          </Text>

          <Text style={styles.subHeading}>Appointments & Cancellations :</Text>
          <Text style={styles.bodyText}>
            Patients are responsible for booking and confirming their appointments.
          </Text>

          <Text style={styles.subHeading}>Confidentiality & Privacy :</Text>
          <Text style={styles.bodyText}>
            All patient information will be handled in compliance with applicable privacy laws.
          </Text>

          {/* Section 2 */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>2. Use Licence</Text>

          <Text style={styles.subHeading}>Compliance :</Text>
          <Text style={styles.bodyText}>
            All licensed use must comply with applicable healthcare laws, ethical standards, and professional regulations.
          </Text>

          <Text style={styles.subHeading}>Restrictions :</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                The license does not permit misuse of medical data or services.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Users may not modify, copy, or redistribute any part of the licensed material without prior written consent.
              </Text>
            </View>
          </View>

          {/* Section 3 */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>3. Data Protection</Text>

          <Text style={styles.subHeading}>Personal Data :</Text>
          <Text style={styles.bodyText}>
            We collect and process personal data only as necessary to provide healthcare services and improve your experience.
          </Text>

          <Text style={styles.subHeading}>Data Security :</Text>
          <Text style={styles.bodyText}>
            All personal and medical data is encrypted and stored securely in compliance with industry standards.
          </Text>

          <Text style={styles.subHeading}>Third-Party Sharing :</Text>
          <Text style={styles.bodyText}>
            Your data will not be shared with third parties without your explicit consent, except as required by law.
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textDecorationLine: 'underline',
    marginBottom: 4,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 4,
  },
  bulletList: {
    marginTop: 6,
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
});
