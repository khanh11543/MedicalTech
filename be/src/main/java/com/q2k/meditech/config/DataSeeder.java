package com.q2k.meditech.config;

import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Data Seeder - Creates test users on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            seedData();
        } catch (Exception e) {
            log.error("Data seeding failed (non-fatal): {}", e.getMessage());
        }
    }

    @Transactional
    public void seedData() {
        log.info("Starting data seeding...");
        
        // Create roles if not exist
        Role rolePatient = getOrCreateRole("PATIENT");
        Role roleDoctor = getOrCreateRole("DOCTOR");
        Role roleReceptionist = getOrCreateRole("RECEPTIONIST");
        Role roleAdmin = getOrCreateRole("ADMIN");
        
        // Create test users matching InMemoryUserDetailsManager
        createUserIfNotExists("patient", "patient@test.com", "0901111111", rolePatient);
        createUserIfNotExists("doctor", "doctor@test.com", "0902222222", roleDoctor);
        createUserIfNotExists("receptionist", "receptionist@test.com", "0903333333", roleReceptionist);
        createUserIfNotExists("admin", "admin@test.com", "0904444444", roleAdmin);
        
        // Ensure all doctors are available for appointments
        updateDoctorsAvailability();

        // Seed specialty metadata (slug, subtitle, highlights, icons)
        seedSpecialtyMetadata();

        // Seed sample reviews for completed appointments
        seedSampleReviews();
        
        log.info("Data seeding completed!");
    }

    /**
     * Update all doctors to be available if they have null or false isAvailable
     */
    private void updateDoctorsAvailability() {
        List<Doctor> doctors = doctorRepository.findAll();
        int updatedCount = 0;
        
        for (Doctor doctor : doctors) {
            if (doctor.getIsAvailable() == null || !doctor.getIsAvailable()) {
                doctor.setIsAvailable(true);
                doctorRepository.save(doctor);
                updatedCount++;
                log.info("Updated doctor {} (ID: {}) to available", doctor.getFullName(), doctor.getId());
            }
        }
        
        if (updatedCount > 0) {
            log.info("Updated {} doctors to be available for appointments", updatedCount);
        }
    }

    /**
     * Seed slug, subtitle, highlights, iconUrl, imageUrl for each specialty if missing
     */
    private void seedSpecialtyMetadata() {
        String[][] meta = {
            // name, slug, subtitle, highlights (JSON), iconUrl, imageUrl
            {"Nội khoa",       "internal-medicine", "Internal Medicine",       "[\"General Checkup\",\"Chronic Disease\",\"Internal Cardiology\"]",        "bi bi-heart-pulse",     "/images/landing/cardiology-2.webp"},
            {"Ngoại khoa",     "orthopedics",       "Surgery & Surgical Care", "[\"General Surgery\",\"Laparoscopic Surgery\",\"Orthopedic Trauma\"]",     "bi bi-bandaid",         "/images/landing/orthopedics-4.webp"},
            {"Nhi khoa",       "pediatrics",        "Children's Health",       "[\"Pediatric Exam\",\"Vaccination\",\"Child Nutrition\"]",                 "bi bi-emoji-smile",     "/images/landing/pediatrics-2.webp"},
            {"Sản phụ khoa",   "obstetrics",        "Women's Health",          "[\"Maternity Care\",\"Gynecology\",\"Family Planning\"]",                  "bi bi-gender-female",   "/images/landing/facilities-1.webp"},
            {"Da liễu",        "dermatology",       "Skin Health Experts",     "[\"Skin Treatment\",\"Cosmetic Dermatology\",\"Laser Therapy\"]",          "bi bi-shield-plus",     "/images/landing/dermatology-3.webp"},
            {"Tim mạch",       "cardiology",        "Heart & Vascular Care",   "[\"Echocardiogram\",\"Interventional Cardiology\",\"Cardiac Surgery\"]",   "bi bi-heart-fill",      "/images/landing/cardiology-3.webp"},
            {"Thần kinh",      "neurology",         "Brain & Nervous System",  "[\"Stroke Treatment\",\"Parkinson Care\",\"Chronic Headache\"]",           "bi bi-lightning-fill",  "/images/landing/neurology-4.webp"},
            {"Mắt",            "ophthalmology",     "Eye Care Specialists",    "[\"Lasik Surgery\",\"Cataract Treatment\",\"Eye Examination\"]",           "bi bi-eye",             "/images/landing/showcase-1.webp"},
            {"Tai Mũi Họng",   "ent",               "ENT Specialists",         "[\"Sinusitis\",\"Tonsillitis\",\"Hearing Treatment\"]",                    "bi bi-ear-fill",        "/images/landing/facilities-1.webp"},
            {"Răng Hàm Mặt",   "dental",            "Dental & Maxillofacial",  "[\"Tooth Extraction\",\"Orthodontics\",\"Maxillofacial Surgery\"]",        "bi bi-emoji-laughing",  "/images/landing/showcase-1.webp"},
            {"Khám tổng quát", "general-checkup",   "General Health Checkup",  "[\"Health Screening\",\"Preventive Care\",\"Annual Checkup\"]",               "bi bi-clipboard2-pulse","/images/landing/cardiology-2.webp"},
        };

        for (String[] row : meta) {
            specialtyRepository.findByNameIgnoreCase(row[0]).ifPresent(s -> {
                boolean changed = false;
                if (s.getSlug() == null)       { s.setSlug(row[1]);       changed = true; }
                if (s.getSubtitle() == null)   { s.setSubtitle(row[2]);   changed = true; }
                if (s.getHighlights() == null) { s.setHighlights(row[3]); changed = true; }
                if (s.getIconUrl() == null || s.getIconUrl().isBlank()) { s.setIconUrl(row[4]); changed = true; }
                if (s.getImageUrl() == null)   { s.setImageUrl(row[5]);   changed = true; }
                if (changed) {
                    specialtyRepository.save(s);
                    log.info("Seeded metadata for specialty: {}", row[0]);
                }
            });
        }
    }

    private void seedSampleReviews() {
        if (reviewRepository.count() > 0) {
            log.info("Reviews already exist, skipping review seeding.");
            return;
        }

        List<Appointment> completedAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .filter(a -> a.getPatient() != null && a.getDoctor() != null)
                .limit(10)
                .toList();

        if (completedAppointments.isEmpty()) {
            log.info("No completed appointments found, skipping review seeding.");
            return;
        }

        String[] comments = {
                "The doctor was very dedicated and thorough. I'm very satisfied with the medical service here.",
                "Quick and efficient examination process, the doctor explained my health condition clearly.",
                "Friendly staff, clean clinic. The doctor is highly skilled and very enthusiastic.",
                "I received very detailed consultation on the treatment plan. Thank you so much, doctor!",
                "Professional service, reasonable waiting time. Will come back for future check-ups.",
                "The doctor patiently listened and answered all my questions. Very trustworthy.",
                "Wonderful medical examination experience. The doctor diagnosed accurately and treated effectively.",
                "Modern facilities, professional medical team. I feel very confident being treated here.",
                "The doctor provided very detailed advice, helping me understand my condition and how to prevent it.",
                "Very satisfied with the quality of service. Skilled doctor, enthusiastic and caring staff.",
        };
        int[] ratings = {5, 5, 5, 4, 5, 5, 4, 5, 5, 4};

        Map<Long, List<Integer>> doctorRatings = new HashMap<>();
        int created = 0;

        for (int i = 0; i < completedAppointments.size(); i++) {
            Appointment apt = completedAppointments.get(i);

            if (reviewRepository.existsByAppointmentId(apt.getId())) {
                continue;
            }

            int rating = ratings[i % ratings.length];
            Review review = Review.builder()
                    .appointment(apt)
                    .patient(apt.getPatient())
                    .doctor(apt.getDoctor())
                    .rating(rating)
                    .comment(comments[i % comments.length])
                    .isAnonymous(false)
                    .isVisible(true)
                    .build();
            reviewRepository.save(review);
            created++;

            doctorRatings.computeIfAbsent(apt.getDoctor().getId(), k -> new ArrayList<>()).add(rating);
            log.info("Seeded review for appointment #{} (doctor: {}, rating: {})",
                    apt.getId(), apt.getDoctor().getFullName(), rating);
        }

        // Update doctor rating aggregates
        for (Map.Entry<Long, List<Integer>> entry : doctorRatings.entrySet()) {
            doctorRepository.findById(entry.getKey()).ifPresent(doctor -> {
                List<Integer> allRatings = entry.getValue();
                double avg = allRatings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                doctor.setRatingAvg(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
                doctor.setRatingCount(allRatings.size());
                doctorRepository.save(doctor);
            });
        }

        log.info("Seeded {} sample reviews.", created);
    }

    private Role getOrCreateRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    log.info("Creating role: {}", roleName);
                    Role role = Role.builder()
                            .name(roleName)
                            .description(roleName + " role")
                            .build();
                    return roleRepository.save(role);
                });
    }

    private void createUserIfNotExists(String username, String email, String phone, Role role) {
        // Check if user exists by email
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isEmpty()) {
            log.info("Creating test user: {} with role: {}", username, role.getName());
            
            User user = User.builder()
                    .email(email)
                    .phone(phone)
                    .passwordHash(passwordEncoder.encode("123456"))
                    .fullName(username.substring(0, 1).toUpperCase() + username.substring(1) + " Test")
                    .isActive(true)
                    .isVerified(true)
                    .twoFactorEnabled(false)
                    .failedLoginCount(0)
                    .userRoles(new HashSet<>())
                    .build();
            
            // Save user first
            user = userRepository.save(user);
            
            // Create UserRole association
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .build();
            user.getUserRoles().add(userRole);
            
            userRepository.save(user);
            log.info("Created user: {} with ID: {}", email, user.getId());
        } else {
            log.info("User already exists: {}", email);
        }
    }
}
