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
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authApi } from '@/services/auth';
import { ApiError } from '@/services/apiClient';

/** Matches backend `ChangePasswordDTO` pattern. */
const NEW_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validateNewPassword(value: string): string | null {
  const t = value?.trim() ?? '';
  if (!t) return 'Please enter a new password.';
  if (t.length < 8 || t.length > 100) return 'Password must be between 8 and 100 characters.';
  if (!NEW_PASSWORD_REGEX.test(t)) {
    return 'Use at least 8 characters with uppercase, lowercase, and a number.';
  }
  return null;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword.trim()) {
      setError('Please enter your current password.');
      return;
    }
    const newErr = validateNewPassword(newPassword);
    if (newErr) {
      setError(newErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword,
        confirmPassword,
      });
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Request failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Change password</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              Enter your current password, then choose a new one. This updates the password you use to sign in with
              email.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.fieldLabel}>Current password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor="#a0b4c8"
                value={currentPassword}
                onChangeText={(t) => {
                  setCurrentPassword(t);
                  if (error) setError('');
                }}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} hitSlop={8}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={22} color="#a0b4c8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>New password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters, A–Z, a–z, 0–9"
                placeholderTextColor="#a0b4c8"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (error) setError('');
                }}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={22} color="#a0b4c8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Confirm new password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat new password"
                placeholderTextColor="#a0b4c8"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (error) setError('');
                }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#a0b4c8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={isSubmitting}>
              <LinearGradient
                colors={['#5b9bd5', '#7ab8e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Removed bottom tint overlay (was causing pink haze). */}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  scrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0b4c8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b6b7a',
    marginBottom: 8,
    marginTop: 4,
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
    marginBottom: 16,
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
  submitButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
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
