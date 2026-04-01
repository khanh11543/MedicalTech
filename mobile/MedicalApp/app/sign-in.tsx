import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authStorage } from '@/lib/authStorage';
import { isAllowedPatientAppUser, PATIENT_APP_ACCESS_DENIED_MESSAGE } from '@/lib/mobileAuthPolicy';
import { authApi } from '@/services/auth';
import { ApiError } from '@/services/apiClient';
import {
  signInWithGoogleMobile,
  signInWithFacebookMobile,
  type OAuthTokenPayload,
} from '@/services/socialAuth';

const { width } = Dimensions.get('window');

function parseLockUntil(message: string): Date | null {
  const match = message.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (match) {
    const date = new Date(match[1]);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function validateEmail(value: string): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'Please enter your email.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [oauthBusy, setOauthBusy] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    (async () => {
      const remembered = await authStorage.getRememberedEmail();
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!lockUntil) {
      setCountdown(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setLockUntil(null);
        setError('');
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const isLocked = countdown > 0;

  const handleSignIn = async () => {
    if (isLocked) return;
    setError('');
    const emailErr = validateEmail(email);
    const missingPassword = !password?.trim();
    if (emailErr || missingPassword) {
      setError(emailErr || 'Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deviceId = await authStorage.getOrCreateDeviceId();
      const trusted = await authStorage.getTrustedDeviceToken();
      const res = await authApi.login({
        email: email.trim(),
        password,
        deviceId,
        deviceName: `MedicalApp (${Platform.OS})`,
        trustedDeviceToken: trusted || undefined,
      });

      if (res.mfaRequired && res.mfaToken) {
        await authStorage.setPendingMfa({
          email: email.trim(),
          mfaToken: res.mfaToken,
          rememberMe,
        });
        router.push('/verify-mfa');
        return;
      }

      const tokenData = res.token;
      if (!tokenData) {
        setError('Unexpected response from server.');
        return;
      }

      if (!isAllowedPatientAppUser(tokenData.roles)) {
        setError(PATIENT_APP_ACCESS_DENIED_MESSAGE);
        return;
      }

      await authStorage.setTokens(tokenData.accessToken, tokenData.refreshToken);
      await authStorage.setUser({
        userId: tokenData.userId,
        email: tokenData.email,
        roles: tokenData.roles || [],
      });
      if (tokenData.trustedDeviceToken) {
        await authStorage.setTrustedDeviceToken(tokenData.trustedDeviceToken);
      }
      if (rememberMe) {
        await authStorage.setRememberedEmail(email.trim());
      } else {
        await authStorage.clearRememberedEmail();
      }
      router.replace('/(tabs)');
    } catch (e) {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : '';
      const status = e instanceof ApiError ? e.status : undefined;

      if (status === 429) {
        const until = parseLockUntil(msg);
        if (until) setLockUntil(until);
        setError(
          msg.includes('IP')
            ? 'Too many attempts. Please try again later.'
            : 'Account temporarily locked due to too many failed attempts.'
        );
      } else if (msg) {
        setError(msg);
      } else if (status === 401) {
        setError('Invalid email or password.');
      } else if (status === 423) {
        setError('Account is locked. Please try again later.');
      } else {
        setError('Sign in failed. Check your connection and API URL.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const finalizeOAuthSignIn = async (tokens: OAuthTokenPayload) => {
    if (!isAllowedPatientAppUser(tokens.roles)) {
      Alert.alert('Sign in', PATIENT_APP_ACCESS_DENIED_MESSAGE);
      return;
    }
    await authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    await authStorage.setUser({
      userId: tokens.userId,
      email: tokens.email,
      roles: tokens.roles,
    });
    await authStorage.setRememberedEmail(tokens.email);
    router.replace('/(tabs)');
  };

  const handleGoogleOAuth = async () => {
    if (oauthBusy || isSubmitting || isLocked) return;
    setError('');
    setOauthBusy('google');
    try {
      const tokens = await signInWithGoogleMobile();
      if (!tokens) {
        Alert.alert('Sign in', 'Google sign-in was cancelled or could not complete.');
        return;
      }
      await finalizeOAuthSignIn(tokens);
    } catch (e) {
      Alert.alert('Sign in', e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setOauthBusy(null);
    }
  };

  const handleFacebookOAuth = async () => {
    if (oauthBusy || isSubmitting || isLocked) return;
    setError('');
    setOauthBusy('facebook');
    try {
      const tokens = await signInWithFacebookMobile();
      if (!tokens) {
        Alert.alert(
          'Sign in',
          'Facebook sign-in was cancelled or could not complete. If this keeps happening, ask your admin to set facebook.oauth2.redirect-uri-mobile on the server and add that URL in the Facebook app settings.',
        );
        return;
      }
      await finalizeOAuthSignIn(tokens);
    } catch (e) {
      Alert.alert('Sign in', e instanceof Error ? e.message : 'Facebook sign-in failed.');
    } finally {
      setOauthBusy(null);
    }
  };

  const socialDisabled = isSubmitting || isLocked || oauthBusy !== null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#d4e6f6', '#c8ddf0', '#e8d8ee']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.illustrationContainer}>
                <View style={styles.phoneBody}>
                  <View style={styles.phoneScreen}>
                    <Ionicons name="finger-print" size={60} color="#3a5a8c" />
                  </View>
                </View>
                <View style={styles.magnifyingGlass}>
                  <Ionicons name="search" size={22} color="#4a6a9c" />
                </View>
                <View style={styles.creditCard}>
                  <View style={styles.cardChip} />
                  <View style={styles.cardLine} />
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign in to Continue</Text>

            {error ? (
              <View style={[styles.banner, isLocked && styles.bannerLock]}>
                <Text style={[styles.bannerText, isLocked && styles.bannerTextLock]}>{error}</Text>
                {isLocked ? (
                  <Text style={styles.countdownText}>Try again in {formatCountdown(countdown)}</Text>
                ) : null}
              </View>
            ) : null}

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

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#a0b4c8"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#a0b4c8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={isSubmitting || isLocked}
            >
              <LinearGradient
                colors={['#5b9bd5', '#7ab8e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.signInButton, (isSubmitting || isLocked) && styles.signInButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInButtonText}>
                    {isLocked ? `Locked (${formatCountdown(countdown)})` : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>{"Don't have an account ? "}</Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton, socialDisabled && styles.socialButtonDisabled]}
                onPress={handleFacebookOAuth}
                disabled={socialDisabled}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Facebook"
              >
                {oauthBusy === 'facebook' ? (
                  <ActivityIndicator color="#3b5998" />
                ) : (
                  <FontAwesome name="facebook" size={22} color="#3b5998" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} accessibilityRole="button">
                <FontAwesome name="apple" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton, socialDisabled && styles.socialButtonDisabled]}
                onPress={handleGoogleOAuth}
                disabled={socialDisabled}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
              >
                {oauthBusy === 'google' ? (
                  <ActivityIndicator color="#ea4335" />
                ) : (
                  <Text style={styles.googleText}>G</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
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
  scrollContent: {
    flexGrow: 1,
  },

  headerContainer: {
    width: '100%',
    height: 260,
  },
  headerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  illustrationContainer: {
    width: 160,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBody: {
    width: 100,
    height: 140,
    backgroundColor: '#2c3e6b',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  phoneScreen: {
    width: 80,
    height: 110,
    backgroundColor: '#d6e4f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnifyingGlass: {
    position: 'absolute',
    top: 30,
    right: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8eef5',
    borderWidth: 2,
    borderColor: '#3a5a8c',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  creditCard: {
    position: 'absolute',
    bottom: 20,
    left: -5,
    width: 55,
    height: 35,
    backgroundColor: '#f5b742',
    borderRadius: 6,
    padding: 6,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardChip: {
    width: 12,
    height: 10,
    backgroundColor: '#e0a030',
    borderRadius: 2,
  },
  cardLine: {
    width: 30,
    height: 4,
    backgroundColor: '#e0a030',
    borderRadius: 2,
  },

  formContainer: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 20,
  },
  banner: {
    backgroundColor: '#fdecea',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  bannerLock: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffe0b2',
  },
  bannerText: {
    color: '#c0392b',
    fontSize: 13,
    textAlign: 'center',
  },
  bannerTextLock: {
    color: '#e65100',
  },
  countdownText: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '700',
    color: '#e65100',
    fontSize: 14,
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
  eyeIcon: {
    padding: 4,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  checkboxChecked: {
    backgroundColor: '#5b9bd5',
    borderColor: '#5b9bd5',
  },
  rememberText: {
    fontSize: 13,
    color: '#8a8a9e',
  },
  forgotText: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
  },

  signInButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.75,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  signUpText: {
    fontSize: 14,
    color: '#8a8a9e',
  },
  signUpLink: {
    fontSize: 14,
    color: '#5b9bd5',
    fontWeight: '600',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    gap: 20,
  },
  socialButton: {
    width: width * 0.22,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f9fc',
    borderWidth: 1,
    borderColor: '#e8eef5',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  facebookButton: {},
  appleButton: {},
  googleButton: {},
  socialButtonDisabled: { opacity: 0.55 },
  googleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ea4335',
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
