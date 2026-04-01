import React, { useEffect, useState } from 'react';
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
import { authStorage, type PendingMfa } from '@/lib/authStorage';
import { isAllowedPatientAppUser, PATIENT_APP_ACCESS_DENIED_MESSAGE } from '@/lib/mobileAuthPolicy';
import { authApi } from '@/services/auth';

function isValidMfaCode(value: string): boolean {
  const t = value.trim();
  return /^[0-9]{6}$/.test(t) || /^[A-Za-z0-9]{8,32}$/.test(t);
}

export default function VerifyMfaScreen() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingMfa | null>(null);
  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await authStorage.getPendingMfa();
      if (!alive) return;
      if (!p?.mfaToken || !p?.email) {
        router.replace('/sign-in');
        return;
      }
      setPending(p);
      setRememberDevice(p.rememberMe);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const handleVerify = async () => {
    if (!pending) return;
    setError('');
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter your 6-digit Authenticator code or backup code.');
      return;
    }
    if (!isValidMfaCode(trimmed)) {
      setError('Use a 6-digit code or backup code (8–32 letters/numbers).');
      return;
    }
    setIsSubmitting(true);
    try {
      const deviceId = await authStorage.getOrCreateDeviceId();
      const tokenData = await authApi.verifyMfaLogin({
        mfaToken: pending.mfaToken,
        code: trimmed,
        rememberDevice,
        deviceId,
      });
      if (!isAllowedPatientAppUser(tokenData.roles)) {
        setError(PATIENT_APP_ACCESS_DENIED_MESSAGE);
        return;
      }
      if (tokenData.trustedDeviceToken) {
        await authStorage.setTrustedDeviceToken(tokenData.trustedDeviceToken);
      }
      await authStorage.setTokens(tokenData.accessToken, tokenData.refreshToken);
      await authStorage.setUser({
        userId: tokenData.userId,
        email: tokenData.email,
        roles: tokenData.roles || [],
      });
      if (pending.rememberMe) {
        await authStorage.setRememberedEmail(pending.email);
      } else {
        await authStorage.clearRememberedEmail();
      }
      await authStorage.clearPendingMfa();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pending) return null;

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
            <TouchableOpacity
              onPress={async () => {
                await authStorage.clearPendingMfa();
                router.replace('/sign-in');
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Two-factor</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Enter the code from your Authenticator app or a backup code.</Text>
            <Text style={styles.email}>{pending.email}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6-digit or backup code"
                placeholderTextColor="#a0b4c8"
                value={code}
                onChangeText={(t) => {
                  setCode(t.replace(/[^A-Za-z0-9]/g, ''));
                  if (error) setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={32}
              />
            </View>

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberDevice(!rememberDevice)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
                {rememberDevice ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.rememberText}>Remember this device</Text>
            </TouchableOpacity>

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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
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
  subtitle: { fontSize: 14, color: '#a0b4c8', textAlign: 'center', lineHeight: 22 },
  email: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  error: { color: '#c0392b', fontSize: 13, textAlign: 'center', marginBottom: 12 },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1a1a2e', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#c0c8d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#5b9bd5', borderColor: '#5b9bd5' },
  rememberText: { fontSize: 13, color: '#8a8a9e' },
  button: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
