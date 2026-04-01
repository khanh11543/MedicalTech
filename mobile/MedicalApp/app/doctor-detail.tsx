import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const reviews = [
  {
    name: 'Richard Morgan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 5.0,
    text: 'The team went above & beyond to ensure I felt safe, understood through out the entire',
    date: '08 May 2025 at 4:30 pm',
  },
  {
    name: 'Isabella Wilson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    rating: 5.0,
    text: 'The team went above & beyond to ensure I felt safe, understood through out the entire',
    date: '08 May 2025 at 4:30 pm',
  },
];

export default function DoctorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    specialty: string;
    hours: string;
    price: string;
    rating: string;
    image: string;
  }>();

  const name = params.name || 'Dr. Emily Johnson';
  const specialty = params.specialty || 'Neurologist';
  const hours = params.hours || '9.00 am-7.30 pm';
  const price = params.price || '$29';
  const rating = parseFloat(params.rating || '5.0');
  const image = params.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';

  return (
    <View style={styles.container}>
      {/* Bottom gradient */}
      <LinearGradient
        colors={['#f5dce8', '#ecc8d8']}
        style={styles.bottomGradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#d6e4f0', '#e0ecf5']}
              style={styles.heroBg}
            />

            {/* Back button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
            </TouchableOpacity>

            {/* Doctor image with teal circle */}
            <View style={styles.imageContainer}>
              <View style={styles.tealCircle} />
              <Image source={{ uri: image }} style={styles.doctorImage} />
            </View>

            {/* Favorite icon */}
            <TouchableOpacity style={styles.favoriteBtn}>
              <Ionicons name="star-outline" size={22} color="#c0c8d4" />
            </TouchableOpacity>
          </View>

          {/* Doctor Info */}
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{name}</Text>
                <Text style={styles.specialty}>{specialty}</Text>
              </View>
              <Text style={styles.price}>{price}</Text>
            </View>

            <View style={styles.scheduleRatingRow}>
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={15} color="#5b9bd5" />
                <Text style={styles.scheduleText}>{hours}</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={14}
                    color={i <= Math.floor(rating) ? '#f97316' : '#d1d5db'}
                  />
                ))}
                <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Career Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Overview</Text>
            <Text style={styles.overviewText}>
              I received excellent care from start to finish. The doctor was attentive, answered all my
              questions, and the follow-up process was smooth and reassuring. From diagnosis to
              recovery, everything was handled with compassion
            </Text>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({reviews.length * 5 + 1})</Text>
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={14} color="#5b9bd5" />
              </TouchableOpacity>
            </View>

            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewRatingBadge}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                  <TouchableOpacity style={styles.replyBtn}>
                    <Text style={styles.replyText}>Reply</Text>
                    <Ionicons name="chevron-forward" size={12} color="#5b9bd5" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.appointmentBtnWrapper}
            onPress={() => router.push({
              pathname: '/make-appointment',
              params: { name, specialty, image },
            })}
          >
            <LinearGradient
              colors={['#5b9bd5', '#4a8ec4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.appointmentBtn}
            >
              <Text style={styles.appointmentBtnText}>Make an Appointment</Text>
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
    backgroundColor: '#f0f4f8',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* Hero */
  heroSection: {
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  tealCircle: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    backgroundColor: '#7dd3c8',
  },
  doctorImage: {
    width: SCREEN_WIDTH * 0.48,
    height: SCREEN_WIDTH * 0.55,
    resizeMode: 'cover',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.2,
    borderBottomRightRadius: SCREEN_WIDTH * 0.2,
  },
  favoriteBtn: {
    position: 'absolute',
    top: SCREEN_WIDTH * 0.45,
    right: 30,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Info */
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  specialty: {
    fontSize: 14,
    color: '#8a8a9e',
    marginTop: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  scheduleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleText: {
    fontSize: 13,
    color: '#6b7280',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginLeft: 4,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#e8eef5',
    marginHorizontal: 24,
    marginVertical: 18,
  },

  /* Section */
  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    fontStyle: 'italic',
  },
  overviewText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginTop: 10,
  },

  /* Reviews */
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#5b9bd5',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  reviewerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  reviewRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  reviewText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewDate: {
    fontSize: 12,
    color: '#5b9bd5',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#5b9bd5',
    fontWeight: '500',
  },

  /* Bottom */
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  appointmentBtnWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  appointmentBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 28,
  },
  appointmentBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
