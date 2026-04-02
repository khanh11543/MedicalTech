import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { authApi } from '@/services/auth';

function validateEmail(value: string): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'Please enter your email.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    setError('');
    const err = validateEmail(email);
    if (err) {
      setError(err);
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.headerTitle}>Forgot password</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            {success ? (
              <>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.subtitle}>
                  If an account exists for this address, we sent instructions. The temporary password is valid for 15
                  minutes — sign in and change it in your profile.
                </Text>
                <TouchableOpacity onPress={() => router.replace('/sign-in')} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#5b9bd5', '#7ab8e0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendButton}
                  >
                    <Text style={styles.sendButtonText}>Back to sign in</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Enter your email address to request a password reset.
                </Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#a0b4c8"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity onPress={handleSend} activeOpacity={0.85} disabled={isSubmitting}>
                  <LinearGradient
                    colors={['#5b9bd5', '#7ab8e0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>Send</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Removed bottom tint overlay (was causing pink haze). */}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0b4c8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 12,
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8eef5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
  },

  sendButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.75,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
  },
});
