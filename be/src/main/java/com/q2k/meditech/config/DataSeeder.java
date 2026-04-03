package com.q2k.meditech.config;

import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.ServiceCategory;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final RoomRepository roomRepository;
    private final MedicalServiceRepository medicalServiceRepository;
    private final JdbcTemplate jdbcTemplate;
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

        // Fix: widen status columns so longer enum values fit (e.g. AWAITING_SERVICE_RESULTS, READY_TO_FINALIZE)
        for (String table : List.of("appointments", "consultations")) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " MODIFY COLUMN status VARCHAR(50) NOT NULL");
                log.info("Widened {}.status column to VARCHAR(50)", table);
            } catch (Exception e) {
                log.debug("{}.status column already correct or alter skipped: {}", table, e.getMessage());
            }
        }
        
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

        // Seed specialties/departments first (required for services and doctors)
        seedSpecialties();

        // Seed medical services catalog (linked to speciesalties)
        seedMedicalServices();

        // Seed specialist doctors for service departments
        seedSpecialistDoctors();

        // Seed rooms and assign doctors
        seedRoomsAndAssignments();

        // Seed specialty metadata (slug, subtitle, highlights, icons)
        seedSpecialtyMetadata();

        // Seed sample reviews for completed appointments
        seedSampleReviews();
        
        log.info("Data seeding completed!");
    }

    /**
     * Seed the medical_services catalog so "Order Service" modal has data.
     * Each service maps to a ServiceCategory which routes to a department.
     */
    private void seedMedicalServices() {
        if (medicalServiceRepository.count() > 0) {
            log.info("Medical services already exist, skipping seed.");
            return;
        }
        log.info("Seeding medical services catalog...");

        // category, serviceName, price, description
        Object[][] services = {
            // DIAGNOSTIC_IMAGING → Radiology department
            {ServiceCategory.DIAGNOSTIC_IMAGING, "Chest X-ray", 200000, "Standard posteroanterior chest radiograph"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "Abdominal X-ray", 200000, "Plain abdominal radiograph"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "CT Scan - Head", 1500000, "Computed tomography of the head without contrast"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "CT Scan - Chest", 1500000, "Computed tomography of chest"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "CT Scan - Abdomen", 1800000, "Computed tomography of abdomen and pelvis"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "MRI - Brain", 3000000, "Magnetic resonance imaging of the brain"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "MRI - Spine", 3000000, "Magnetic resonance imaging of spine"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "MRI - Knee", 2500000, "MRI of knee joint"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "Bone Density Scan (DEXA)", 500000, "Dual-energy X-ray absorptiometry"},
            {ServiceCategory.DIAGNOSTIC_IMAGING, "Mammography", 400000, "Bilateral mammography screening"},

            // LABORATORY → Lab department
            {ServiceCategory.LABORATORY, "CBC (Complete Blood Count)", 150000, "Full blood count with differential"},
            {ServiceCategory.LABORATORY, "Blood Glucose (Fasting)", 80000, "Fasting blood glucose level"},
            {ServiceCategory.LABORATORY, "Blood Glucose (Random)", 80000, "Random blood glucose level"},
            {ServiceCategory.LABORATORY, "HbA1c", 180000, "Glycated hemoglobin test"},
            {ServiceCategory.LABORATORY, "Liver Function Test (LFT)", 250000, "AST, ALT, ALP, bilirubin, albumin"},
            {ServiceCategory.LABORATORY, "Kidney Function Test (RFT)", 250000, "BUN, creatinine, eGFR, electrolytes"},
            {ServiceCategory.LABORATORY, "Lipid Panel", 200000, "Total cholesterol, HDL, LDL, triglycerides"},
            {ServiceCategory.LABORATORY, "Urinalysis", 100000, "Complete urinalysis with microscopy"},
            {ServiceCategory.LABORATORY, "Thyroid Function (TSH)", 200000, "Thyroid-stimulating hormone"},
            {ServiceCategory.LABORATORY, "Thyroid Panel (TSH, T3, T4)", 350000, "Full thyroid panel"},
            {ServiceCategory.LABORATORY, "CRP (C-Reactive Protein)", 120000, "Inflammatory marker"},
            {ServiceCategory.LABORATORY, "ESR", 80000, "Erythrocyte sedimentation rate"},
            {ServiceCategory.LABORATORY, "Blood Culture", 300000, "Aerobic and anaerobic blood culture"},
            {ServiceCategory.LABORATORY, "Urine Culture", 200000, "Urine culture and sensitivity"},
            {ServiceCategory.LABORATORY, "Coagulation Panel (PT/INR, aPTT)", 200000, "Prothrombin time and partial thromboplastin time"},
            {ServiceCategory.LABORATORY, "HIV Screening", 150000, "HIV 1/2 antibody and p24 antigen"},
            {ServiceCategory.LABORATORY, "Hepatitis B Panel", 250000, "HBsAg, anti-HBs, anti-HBc"},
            {ServiceCategory.LABORATORY, "Hepatitis C Antibody", 200000, "Anti-HCV screening"},
            {ServiceCategory.LABORATORY, "PSA", 200000, "Prostate-specific antigen screening"},
            {ServiceCategory.LABORATORY, "Vitamin D Level", 250000, "25-hydroxyvitamin D"},
            {ServiceCategory.LABORATORY, "Iron Studies", 200000, "Serum iron, ferritin, TIBC"},
            {ServiceCategory.LABORATORY, "Electrolyte Panel", 150000, "Na, K, Cl, CO2"},

            // ULTRASOUND → Ultrasound department
            {ServiceCategory.ULTRASOUND, "Abdominal Ultrasound", 350000, "Complete abdominal ultrasound"},
            {ServiceCategory.ULTRASOUND, "Pelvic Ultrasound", 350000, "Transabdominal pelvic ultrasound"},
            {ServiceCategory.ULTRASOUND, "Thyroid Ultrasound", 300000, "Thyroid gland ultrasound"},
            {ServiceCategory.ULTRASOUND, "Breast Ultrasound", 300000, "Bilateral breast ultrasound"},
            {ServiceCategory.ULTRASOUND, "Renal Ultrasound", 300000, "Kidney and urinary tract ultrasound"},
            {ServiceCategory.ULTRASOUND, "Obstetric Ultrasound", 400000, "Obstetric ultrasound with fetal assessment"},
            {ServiceCategory.ULTRASOUND, "Doppler - Carotid", 500000, "Carotid artery duplex scan"},
            {ServiceCategory.ULTRASOUND, "Doppler - Lower Extremity", 500000, "Venous/arterial duplex of legs"},

            // CARDIOLOGY_TEST → Cardiology department
            {ServiceCategory.CARDIOLOGY_TEST, "ECG (Electrocardiogram)", 150000, "12-lead resting ECG"},
            {ServiceCategory.CARDIOLOGY_TEST, "Echocardiogram", 500000, "Transthoracic echocardiography"},
            {ServiceCategory.CARDIOLOGY_TEST, "Stress Test (Treadmill)", 800000, "Exercise stress test with ECG monitoring"},
            {ServiceCategory.CARDIOLOGY_TEST, "Holter Monitor (24h)", 600000, "24-hour ambulatory ECG monitoring"},
            {ServiceCategory.CARDIOLOGY_TEST, "Holter Monitor (48h)", 900000, "48-hour ambulatory ECG monitoring"},

            // PATHOLOGY → Pathology department
            {ServiceCategory.PATHOLOGY, "Biopsy - Skin", 500000, "Skin biopsy with histopathology"},
            {ServiceCategory.PATHOLOGY, "Biopsy - Tissue", 800000, "Tissue biopsy with histopathology"},
            {ServiceCategory.PATHOLOGY, "Pap Smear", 200000, "Cervical cytology screening"},
            {ServiceCategory.PATHOLOGY, "Fine Needle Aspiration (FNA)", 600000, "Fine needle aspiration biopsy"},

            // ENDOSCOPY → Endoscopy department
            {ServiceCategory.ENDOSCOPY, "Upper GI Endoscopy", 1500000, "Esophagogastroduodenoscopy (EGD)"},
            {ServiceCategory.ENDOSCOPY, "Colonoscopy", 2000000, "Complete colonoscopy"},
            {ServiceCategory.ENDOSCOPY, "Bronchoscopy", 2500000, "Flexible bronchoscopy"},

            // OTHER
            {ServiceCategory.OTHER, "Pulmonary Function Test", 300000, "Spirometry and lung function assessment"},
            {ServiceCategory.OTHER, "Audiometry", 200000, "Pure tone audiometry hearing test"},
            {ServiceCategory.OTHER, "Visual Acuity Test", 100000, "Standard visual acuity assessment"},
            {ServiceCategory.OTHER, "Allergy Skin Prick Test", 400000, "Skin prick test for common allergens"},
        };

        // Map ServiceCategory to Specialty name
        Map<ServiceCategory, String> categoryToSpecialty = new HashMap<>();
        categoryToSpecialty.put(ServiceCategory.DIAGNOSTIC_IMAGING, "Radiology");
        categoryToSpecialty.put(ServiceCategory.LABORATORY, "Laboratory");
        categoryToSpecialty.put(ServiceCategory.ULTRASOUND, "Ultrasound");
        categoryToSpecialty.put(ServiceCategory.CARDIOLOGY_TEST, "Cardiology");
        categoryToSpecialty.put(ServiceCategory.PATHOLOGY, "Pathology");
        categoryToSpecialty.put(ServiceCategory.ENDOSCOPY, "Endoscopy");
        categoryToSpecialty.put(ServiceCategory.OTHER, "Radiology"); // Default OTHER to Radiology

        int count = 0;
        for (Object[] row : services) {
            ServiceCategory category = (ServiceCategory) row[0];
            String specialtyName = categoryToSpecialty.get(category);
            Specialty specialty = specialtyRepository.findByName(specialtyName).orElse(null);
            
            if (specialty == null) {
                log.warn("Specialty not found for category {}, skipping service {}", category, row[1]);
                continue;
            }

            MedicalService ms = MedicalService.builder()
                    .serviceName((String) row[1])
                    .category(category)
                    .specialty(specialty)  // Link to specialty
                    .defaultPrice(BigDecimal.valueOf((Integer) row[2]))
                    .description((String) row[3])
                    .active(true)
                    .build();
            medicalServiceRepository.save(ms);
            count++;
        }
        log.info("Seeded {} medical services across {} specialties.", count, categoryToSpecialty.size());
    }

    private void seedRoomsAndAssignments() {
        // Create a small set of rooms if missing
        String[] roomNumbers = {"101", "102", "103", "104", "201", "202", "203", "204"};
        Map<String, Room> roomsByNumber = new HashMap<>();
        for (String rn : roomNumbers) {
            Room room = roomRepository.findByRoomNumber(rn).orElse(null);
            if (room == null) {
                room = Room.builder()
                        .roomNumber(rn)
                        .name("Consultation Room " + rn)
                        .floor(parseFloor(rn))
                        .isActive(true)
                        .build();
                room = roomRepository.save(room);
            }
            roomsByNumber.put(rn, room);
        }

        // Avoid violating unique constraint on doctors.room_id (one doctor per room)
        List<Doctor> doctors = doctorRepository.findAll();
        Set<Long> usedRoomIds = doctors.stream()
                .filter(d -> d.getRoom() != null && d.getRoom().getId() != null)
                .map(d -> d.getRoom().getId())
                .collect(java.util.stream.Collectors.toSet());

        // Prefer linking doctors that already have currentRoom -> Room entity (if not used)
        for (Doctor d : doctors) {
            if (d.getRoom() != null) continue;
            String cr = d.getCurrentRoom();
            if (cr == null || cr.isBlank()) continue;
            Room room = roomsByNumber.get(cr);
            if (room != null && room.getId() != null && !usedRoomIds.contains(room.getId())) {
                d.setRoom(room);
                usedRoomIds.add(room.getId());
                doctorRepository.save(d);
                log.info("Linked doctor {} (ID: {}) to existing room {}", d.getFullName(), d.getId(), cr);
            }
        }

        // Assign remaining doctors (no room + no currentRoom) to free rooms
        for (Doctor d : doctors) {
            if (d.getRoom() != null) continue;
            if (d.getCurrentRoom() != null && !d.getCurrentRoom().isBlank()) continue;

            Room free = roomsByNumber.values().stream()
                    .filter(r -> r.getId() != null && !usedRoomIds.contains(r.getId()))
                    .sorted(java.util.Comparator.comparing(Room::getRoomNumber))
                    .findFirst()
                    .orElse(null);

            if (free == null) break;

            d.setRoom(free);
            d.setCurrentRoom(free.getRoomNumber()); // backward compat
            usedRoomIds.add(free.getId());
            doctorRepository.save(d);
            log.info("Assigned doctor {} (ID: {}) to room {}", d.getFullName(), d.getId(), free.getRoomNumber());
        }
    }

    private Integer parseFloor(String roomNumber) {
        try {
            if (roomNumber != null && roomNumber.length() >= 1) {
                char c = roomNumber.charAt(0);
                if (Character.isDigit(c)) return Character.getNumericValue(c);
            }
        } catch (Exception ignored) {
        }
        return null;
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
     * Seed the main specialties/departments for the service ordering workflow.
     * These represent different clinical departments that can perform services.
     */
    private void seedSpecialties() {
        log.info("Seeding specialties (departments)...");

        // Specialty names for service departments
        String[] specialtyNames = {
            "Radiology",           // X-ray, CT, MRI
            "Laboratory",          // Blood tests, urinalysis
            "Ultrasound",          // Ultrasound scans
            "Cardiology",          // ECG, echocardiogram
            "Pathology",           // Tissue biopsies
            "Endoscopy",           // Gastro-intestinal procedures
        };

        int created = 0;
        for (String name : specialtyNames) {
            if (specialtyRepository.findByName(name).isPresent()) {
                continue;
            }
            Specialty specialty = Specialty.builder()
                    .name(name)
                    .slug(name.toLowerCase().replace(" ", "-"))
                    .description(name + " Department - Provides " + name.toLowerCase() + " services")
                    .isActive(true)
                    .build();
            specialtyRepository.save(specialty);
            created++;
            log.info("Created specialty: {}", name);
        }
        if (created == 0) {
            log.info("All department specialties already exist, skipping seed.");
        }
    }

    /**
     * Seed specialist doctors for each service department.
     * These are doctors assigned to perform services in their respective departments.
     */
    private void seedSpecialistDoctors() {
        // Map of Specialty Name → Doctor Name + Specialization
        String[][] specialists = {
            {"Radiology",       "Dr. Nguyễn Radiology", "Chẩn đoán hình ảnh - Radiology"},
            {"Laboratory",      "Dr. Trần Laboratory",  "Xét nghiệm - Laboratory Science"},
            {"Ultrasound",      "Dr. Hoàng Ultrasound", "Siêu âm - Ultrasound"},
            {"Cardiology",      "Dr. Võ Cardiology",    "Tim mạch - Cardiology"},
            {"Pathology",       "Dr. Lê Pathology",     "Giải phẫu bệnh - Pathology"},
            {"Endoscopy",       "Dr. Phạm Endoscopy",   "Nội soi - Endoscopy"},
        };

        for (String[] spec : specialists) {
            String specialtyName = spec[0];
            String doctorName = spec[1];
            String specialization = spec[2];

            // Find the specialty
            Specialty specialty = specialtyRepository.findByName(specialtyName)
                    .orElse(null);
            if (specialty == null) {
                log.warn("Specialty not found: {}", specialtyName);
                continue;
            }

            // Check if specialist doctor already exists for this specialty
            String lowerSpecialty = specialtyName.toLowerCase();
            boolean doctorExists = doctorRepository.findAll().stream()
                    .anyMatch(d -> {
                        String[] parts = d.getFullName().toLowerCase().split(" ");
                        // Check if any part of the name matches the specialty name
                        for (String part : parts) {
                            if (lowerSpecialty.contains(part) && part.length() > 2) return true;
                        }
                        return false;
                    });
            if (doctorExists) {
                log.info("Specialist for {} already exists, skipping.", specialtyName);
                continue;
            }

            // Create user account for the specialist
            String email = specialtyName.toLowerCase() + "@meditech.local";
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;
            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                Role doctorRole = getOrCreateRole("DOCTOR");
                user = User.builder()
                        .email(email)
                        .phone("09" + String.format("%08d", email.hashCode() & 0x7FFFFFF).substring(0, 8))
                        .passwordHash(passwordEncoder.encode("123456"))
                        .fullName(doctorName)
                        .isActive(true)
                        .isVerified(true)
                        .twoFactorEnabled(false)
                        .failedLoginCount(0)
                        .userRoles(new HashSet<>())
                        .build();
                user = userRepository.save(user);

                UserRole userRole = UserRole.builder().user(user).role(doctorRole).build();
                user.getUserRoles().add(userRole);
                user = userRepository.save(user);
                log.info("Created specialist doctor user: {}", email);
            }

            // Create or update Doctor entity
            Optional<Doctor> existingDoctor = doctorRepository.findByUserId(user.getId());
            Doctor doctor;
            if (existingDoctor.isPresent()) {
                doctor = existingDoctor.get();
            } else {
                doctor = Doctor.builder()
                        .user(user)
                        .fullName(doctorName)
                        .specialization(specialization)
                        .isAvailable(true)
                        .experienceYears(8)
                        .build();
            }
            doctor.setDepartment(specialtyName);  // Set department string for backward compatibility
            doctorRepository.save(doctor);
            log.info("Created/assigned specialist doctor '{}' to department '{}'", doctorName, specialtyName);
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
