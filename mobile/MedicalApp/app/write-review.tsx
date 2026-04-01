import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctor: string;
    specialty: string;
  }>();

  const doctor = params.doctor || 'Doctor';

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    Alert.alert(
      'Thank you!',
      `Your ${rating}-star review has been submitted.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <View style={styles.container}>
      {/* Blue side borders */}
      <View style={styles.leftBorder} />
      <View style={styles.rightBorder} />

      {/* Top gradient */}
      <LinearGradient
        colors={['#d6e4f0', '#eaf0f7', '#f0f4f8']}
        style={styles.topGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.backCircle}>
              <Ionicons name="chevron-back" size={18} color="#3b82f6" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <View style={styles.bellCircle}>
              <Ionicons name="notifications-outline" size={18} color="#3b82f6" />
              <View style={styles.bellDot} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            What do you <Text style={styles.titleHighlight}>think!</Text>
          </Text>
          <Text style={styles.subtitle}>
            Please give your rating by clicking on{'\n'}the stars below.
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color="#3b82f6"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <Ionicons name="create-outline" size={18} color="#9ca3af" />
              <Text style={styles.inputPlaceholderIcon}> </Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us about your experience"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={review}
              onChangeText={setReview}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitBtnText}>Submit</Text>
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
    backgroundColor: '#f0f6ff',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3b82f6',
  },
  rightBorder: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3b82f6',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  safeArea: {
    flex: 1,
  },

  /* Header */
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
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleHighlight: {
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },

  /* Stars */
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 34,
  },
  starBtn: {
    padding: 2,
  },

  /* Input */
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    padding: 16,
    minHeight: 140,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputPlaceholderIcon: {
    width: 4,
  },
  textInput: {
    fontSize: 14,
    color: '#1a1a2e',
    flex: 1,
    minHeight: 90,
  },

  /* Submit */
  submitBtnWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 26,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
