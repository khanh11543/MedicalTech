import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const supportQuestions = [
  'How to delete account?',
  'How do i delete my past visits?',
  "I don't need notification.",
  'How to download all prescriptions?',
  'How do I reorder my medicines?',
  'How to change my password?',
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <View style={styles.bellCircle}>
              <Ionicons name="notifications-outline" size={18} color="#3b82f6" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Blue divider line */}
        <LinearGradient
          colors={['#3b82f6', '#60a5fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerDivider}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search here..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Live Chat Banner */}
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveChatBanner}
          >
            <View style={styles.liveChatLeft}>
              <View style={styles.liveChatAvatarBg}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face' }}
                  style={styles.liveChatAvatar}
                />
              </View>
            </View>
            <View style={styles.liveChatContent}>
              <Text style={styles.liveChatTitle}>Live Chat</Text>
              <Text style={styles.liveChatSubtitle}>with our Support</Text>
              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Questions List */}
          <View style={styles.questionsList}>
            {supportQuestions.map((q, index) => (
              <TouchableOpacity key={index} style={styles.questionCard} activeOpacity={0.7}>
                <Text style={styles.questionText}>{q}</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
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
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 3,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Live Chat */
  liveChatBanner: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  liveChatLeft: {
    marginRight: 16,
  },
  liveChatAvatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  liveChatAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  liveChatContent: {
    flex: 1,
  },
  liveChatTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  liveChatSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  startBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  /* Questions */
  questionsList: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
    marginRight: 12,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d0dbe8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
