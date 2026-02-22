package com.q2k.meditech.config;

import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.RoleRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

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
