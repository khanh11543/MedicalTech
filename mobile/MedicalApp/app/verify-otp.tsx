import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '@/services/auth';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string | string[] }>();
  const email = (Array.isArray(emailParam) ? emailParam[0] : emailParam)?.trim() ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace('/sign-up');
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const setDigit = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    const next = [...otp];

    if (digits.length <= 1) {
      next[index] = digits;
      setOtp(next);
      if (digits && index < 5) inputRefs.current[index + 1]?.focus();
      return;
    }

    for (let i = 0; i < digits.length && index + i < 6; i++) {
      next[index + i] = digits[i];
    }
    setOtp(next);
    inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authApi.verifyEmail({ email, otpCode });
      setSuccess(res.message || 'Email verified.');
      setTimeout(() => {
        router.replace('/sign-in');
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    try {
      await authApi.resendOtp(email);
      setSuccess('A new code has been sent to your email.');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend.');
      setResendCooldown(30);
    }
  };

  if (!email) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify email</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
            <Text style={styles.email}>{email}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  style={styles.otpCell}
                  value={digit}
                  onChangeText={(v) => setDigit(index, v)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} disabled={isSubmitting}>
              <LinearGradient
                colors={['#5b9bd5', '#7ab8e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0} style={styles.resendWrap}>
              <Text style={[styles.resend, resendCooldown > 0 && styles.resendDisabled]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {/* Removed bottom tint overlay (was causing pink haze). */}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  content: { paddingHorizontal: 28, paddingTop: 12 },
  subtitle: { fontSize: 14, color: '#a0b4c8', textAlign: 'center' },
  email: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  error: { color: '#c0392b', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  success: { color: '#27ae60', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  otpCell: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8eef5',
    backgroundColor: '#f7f9fc',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  button: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resendWrap: { marginTop: 20, alignItems: 'center' },
  resend: { fontSize: 14, color: '#5b9bd5', fontWeight: '600' },
  resendDisabled: { color: '#a0b4c8' },
});
