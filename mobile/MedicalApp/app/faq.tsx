import React, { useState } from 'react';
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

const faqData = [
  {
    question: 'How do I access my test results?',
    answer:
      'You can download your reports through our patient portal, mobile app, or collect them from the front desk.',
  },
  {
    question: 'Do you accept health insurance?',
    answer:
      'Yes, we accept most major health insurance providers. Please contact our front desk to verify your specific plan.',
  },
  {
    question: 'What if I need urgent medical care?',
    answer:
      'For emergencies, please call 911 or visit your nearest emergency room. For urgent but non-life-threatening issues, you can use our walk-in clinic during operating hours.',
  },
  {
    question: 'How do I book an appointment with a doctor?',
    answer:
      'You can book an appointment through our mobile app, website patient portal, or by calling our reception desk directly.',
  },
  {
    question: 'What should I bring to my first visit?',
    answer:
      'Please bring a valid photo ID, your insurance card, a list of current medications, and any relevant medical records or referral letters.',
  },
  {
    question: 'Are online consultations available?',
    answer:
      'Yes, we offer online video consultations with many of our doctors. You can book a virtual appointment through the app.',
  },
  {
    question: 'How do I reschedule or cancel an appointment?',
    answer:
      'You can reschedule or cancel through the app under "My Appointments", or call our reception at least 24 hours before your scheduled visit.',
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* FAQ List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {faqData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqCard,
                expandedIndex === index && styles.faqCardExpanded,
              ]}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'arrow-down' : 'arrow-forward'}
                  size={18}
                  color="#8a8a9e"
                />
              </View>
              {expandedIndex === index && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </>
              )}
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
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  faqCardExpanded: {
    backgroundColor: '#fff',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eef5',
    marginVertical: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
});
