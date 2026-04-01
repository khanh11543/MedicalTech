import React, { useCallback, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { resolveBackendAbsoluteUrl } from '@/constants/api';
import { authStorage } from '@/lib/authStorage';
import { ApiError } from '@/services/apiClient';
import {
  fetchPatientProfileFull,
  putPatientProfile,
  type PatientProfileFull,
  type UpdatePatientProfilePayload,
} from '@/services/patientPortalApi';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face';

function applyProfileToForm(p: PatientProfileFull, setters: {
  setFullName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setDateOfBirth: (v: string) => void;
  setGender: (v: string) => void;
  setAddress: (v: string) => void;
  setIdNumber: (v: string) => void;
  setInsuranceNumber: (v: string) => void;
  setInsuranceProvider: (v: string) => void;
  setEmergencyContact: (v: string) => void;
  setBloodGroup: (v: string) => void;
  setAllergies: (v: string) => void;
  setMedicalHistory: (v: string) => void;
}) {
  setters.setFullName(p.fullName ?? '');
  setters.setEmail(p.email ?? '');
  setters.setPhone(p.phone ?? '');
  setters.setDateOfBirth(p.dateOfBirth?.split('T')[0] ?? '');
  setters.setGender(p.gender ?? '');
  setters.setAddress(p.address ?? '');
  setters.setIdNumber(p.idNumber ?? '');
  setters.setInsuranceNumber(p.insuranceNumber ?? '');
  setters.setInsuranceProvider(p.insuranceProvider ?? '');
  setters.setEmergencyContact(p.emergencyContact ?? '');
  setters.setBloodGroup(p.bloodGroup ?? '');
  setters.setAllergies(p.allergies ?? '');
  setters.setMedicalHistory(p.medicalHistory ?? '');
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(PLACEHOLDER_AVATAR);
  const [initialMaskedId, setInitialMaskedId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchPatientProfileFull();
      applyProfileToForm(p, {
        setFullName,
        setEmail,
        setPhone,
        setDateOfBirth,
        setGender,
        setAddress,
        setIdNumber,
        setInsuranceNumber,
        setInsuranceProvider,
        setEmergencyContact,
        setBloodGroup,
        setAllergies,
        setMedicalHistory,
      });
      const masked = p.idNumber?.trim() || null;
      setInitialMaskedId(masked && masked.startsWith('****') ? masked : null);
      setAvatarUri(resolveBackendAbsoluteUrl(p.avatarUrl) ?? PLACEHOLDER_AVATAR);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const payload: UpdatePatientProfilePayload = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender: gender.trim() || undefined,
        address: address.trim() || undefined,
        insuranceNumber: insuranceNumber.trim() || undefined,
        insuranceProvider: insuranceProvider.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        bloodGroup: bloodGroup.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medicalHistory: medicalHistory.trim() || undefined,
      };
      const idTrim = idNumber.trim();
      if (idTrim && idTrim !== initialMaskedId && !idTrim.startsWith('****')) {
        payload.idNumber = idTrim;
      }

      const updated = await putPatientProfile(payload);
      const u = await authStorage.getUser();
      if (u) {
        await authStorage.setUser({
          ...u,
          email: updated.email ?? u.email,
        });
      }
      setInitialMaskedId(updated.idNumber?.startsWith('****') ? updated.idNumber : initialMaskedId);
      setIdNumber(updated.idNumber ?? idNumber);
      Alert.alert('Saved', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.leftBorder} />
      <View style={styles.rightBorder} />
      <LinearGradient
        colors={['#d4e6f6', '#e0eaf4', '#f0f4f8']}
        style={styles.topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.backBtn} />
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#5b9bd5" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.avatarSection}>
                <View style={styles.avatarOuterRing}>
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                </View>
                <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8} disabled>
                  <LinearGradient colors={['#5b9bd5', '#4a8ec4']} style={styles.cameraGradient}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Avatar changes use the web portal</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.fieldLabel}>Full name *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Email</Text>
                <View style={[styles.inputWrapper, styles.inputDisabled]}>
                  <TextInput
                    style={[styles.input, styles.inputReadonly]}
                    value={email}
                    editable={false}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Phone</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>Date of birth (YYYY-MM-DD)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    placeholder="1990-01-15"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={gender}
                    onChangeText={setGender}
                    placeholder="MALE / FEMALE / OTHER"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Address"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>ID (CCCD) — enter full number to replace</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={idNumber}
                    onChangeText={setIdNumber}
                    placeholder="****1234 or new number"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Insurance</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={insuranceNumber}
                    onChangeText={setInsuranceNumber}
                    placeholder="Insurance number"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={insuranceProvider}
                    onChangeText={setInsuranceProvider}
                    placeholder="Insurance provider"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Emergency contact</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    placeholder="Name / phone"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Blood group</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                    placeholder="A+"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <Text style={styles.fieldLabel}>Allergies</Text>
                <View style={[styles.inputWrapper, styles.multilineWrap]}>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="Known allergies"
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>

                <Text style={styles.fieldLabel}>Medical history</Text>
                <View style={[styles.inputWrapper, styles.multilineWrap]}>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={medicalHistory}
                    onChangeText={setMedicalHistory}
                    placeholder="Relevant history"
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </View>

                <TouchableOpacity activeOpacity={0.85} onPress={handleSave} disabled={saving}>
                  <LinearGradient
                    colors={['#5b9bd5', '#4a8ec4']}
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f0f4f8' },
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
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  scrollContent: { paddingBottom: 60 },
  avatarSection: { alignItems: 'center', paddingTop: 14, paddingBottom: 20, position: 'relative' },
  avatarOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#e0eaf4',
    overflow: 'hidden',
    backgroundColor: '#e8eef5',
  },
  avatar: { width: '100%', height: '100%' },
  cameraBtn: {
    position: 'absolute',
    bottom: 36,
    right: '50%',
    marginRight: -52,
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.5,
  },
  cameraGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { fontSize: 11, color: '#8a8a9e', marginTop: 8 },
  form: { paddingHorizontal: 32, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginTop: 10, marginBottom: 4 },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce4ed',
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  inputDisabled: { backgroundColor: '#f3f4f6' },
  input: { fontSize: 15, color: '#1a1a2e', paddingVertical: 14, fontWeight: '500' },
  inputReadonly: { color: '#6b7280' },
  multilineWrap: { paddingVertical: 8 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { borderRadius: 28, paddingVertical: 17, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
