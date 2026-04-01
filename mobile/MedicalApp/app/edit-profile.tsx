import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState('Rason Battler');
  const [email, setEmail] = useState('rasonbattler@gmail.com');
  const [phone, setPhone] = useState('+ 88 (123) - 456 8113');
  const [location, setLocation] = useState('Cambridge, UK');

  const handleSave = () => {
    Alert.alert('Success', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Blue side borders */}
      <View style={styles.leftBorder} />
      <View style={styles.rightBorder} />

      {/* Top gradient */}
      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', '#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarOuterRing}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
                  }}
                  style={styles.avatar}
                />
              </View>
              {/* Camera icon */}
              <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#5b9bd5', '#4a8ec4']}
                  style={styles.cameraGradient}
                >
                  <Ionicons name="camera" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Email */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputWrapper}>
                <View style={styles.phoneRow}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone Number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Location"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity activeOpacity={0.85} onPress={handleSave}>
                <LinearGradient
                  colors={['#5b9bd5', '#4a8ec4']}
                  style={styles.saveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#5b9bd5',
    opacity: 0.15,
  },
  rightBorder: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#5b9bd5',
    opacity: 0.15,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
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
    paddingBottom: 60,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 28,
    position: 'relative',
  },
  avatarOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#e0eaf4',
    overflow: 'hidden',
    backgroundColor: '#e8eef5',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 24,
    right: '50%',
    marginRight: -52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Form */
  form: {
    paddingHorizontal: 32,
    gap: 18,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce4ed',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  input: {
    fontSize: 15,
    color: '#1a1a2e',
    paddingVertical: 16,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
  },

  /* Save Button */
  saveBtn: {
    borderRadius: 28,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
