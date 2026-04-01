import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SignInScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = () => {
    // TODO: Implement sign in logic
    router.replace('/(tabs)');
  };

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

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
          {/* Header Illustration Area */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#d4e6f6', '#c8ddf0', '#e8d8ee']}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.illustrationContainer}>
                {/* Phone illustration */}
                <View style={styles.phoneBody}>
                  <View style={styles.phoneScreen}>
                    {/* Fingerprint icon */}
                    <Ionicons name="finger-print" size={60} color="#3a5a8c" />
                  </View>
                </View>
                {/* Magnifying glass */}
                <View style={styles.magnifyingGlass}>
                  <Ionicons name="search" size={22} color="#4a6a9c" />
                </View>
                {/* Credit card */}
                <View style={styles.creditCard}>
                  <View style={styles.cardChip} />
                  <View style={styles.cardLine} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign in to Continue</Text>

            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Type your full name"
                placeholderTextColor="#a0b4c8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0b4c8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#a0b4c8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#a0b4c8"
                />
              </TouchableOpacity>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password ?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#5b9bd5', '#7ab8e0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>Don't have an account ? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
                <FontAwesome name="facebook" size={22} color="#3b5998" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
                <FontAwesome name="apple" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                <Text style={styles.googleText}>G</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom gradient decoration */}
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

  /* ---- Header / Illustration ---- */
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

  /* ---- Form ---- */
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
    marginBottom: 28,
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

  /* ---- Options Row ---- */
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

  /* ---- Sign In Button ---- */
  signInButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  /* ---- Sign Up ---- */
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

  /* ---- Social Buttons ---- */
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
  googleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ea4335',
  },

  /* ---- Bottom Gradient ---- */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
