package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.UserMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;

import com.q2k.meditech.repository.*;
import jakarta.persistence.criteria.JoinType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;


/**
 * User Service Implementation
 * Contains all business logic for user management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final StaffRegistryRepository staffRegistryRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO> listUsers(String query, String role, Boolean isActive, Pageable pageable) {
        log.info("Listing users with query: {}, role: {}, isActive: {}", query, role, isActive);

        // Capture parameters as final local variables for lambda use
        final String finalQuery = query;
        final String finalRole = role;
        final Boolean finalIsActive = isActive;

        // Build dynamic specification for filtering
        // Always eager fetch userRoles and roles to avoid LazyInitializationException
        Specification<User> spec = (root, criteriaQuery, cb) -> {
            // Eager fetch userRoles and roles for all queries
            if (criteriaQuery != null && criteriaQuery.getResultType() != Long.class) {
                root.fetch("userRoles", JoinType.LEFT).fetch("role", JoinType.LEFT);
            }
            return cb.conjunction();
        };

        // Filter by search query (email or phone)
        if (finalQuery != null && !finalQuery.trim().isEmpty()) {
            String searchQuery = finalQuery.toLowerCase();
            spec = spec.and((root, criteriaQuery, cb) -> cb.or(
                    cb.like(cb.lower(root.get("email")), "%" + searchQuery + "%"),
                    cb.like(cb.lower(root.get("phone")), "%" + searchQuery + "%")));
        }

        // Filter by active status
        if (finalIsActive != null) {
            spec = spec.and((root, criteriaQuery, cb) -> cb.equal(root.get("isActive"), finalIsActive));
        }

        // Filter by role (join userRoles table)
        if (finalRole != null && !finalRole.trim().isEmpty()) {
            String searchRole = finalRole.toLowerCase();
            spec = spec.and((root, criteriaQuery, cb) -> {
                var userRoleJoin = root.join("userRoles", JoinType.LEFT);
                var roleJoin = userRoleJoin.join("role", JoinType.LEFT);
                return cb.equal(cb.lower(roleJoin.get("name")), searchRole);
            });
        }

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(userMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailDTO getUserDetail(Long userId) {
        log.info("Getting user detail for ID: {}", userId);

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserDetailDTO dto = userMapper.toDetailDTO(user);
        dto.setRoles(userMapper.mapRolesToDetailDTO(user.getUserRoles()));

        // Enrich with doctor profile if user has DOCTOR role
        boolean isDoctorRole = user.getUserRoles().stream()
                .anyMatch(ur -> "DOCTOR".equalsIgnoreCase(ur.getRole().getName()));
        if (isDoctorRole) {
            doctorRepository.findByUserId(userId).ifPresent(doctor -> {
                var specialties = doctor.getDoctorSpecialties().stream()
                        .map(ds -> UserDetailDTO.DoctorSpecialtyInfo.builder()
                                .id(ds.getSpecialty().getId())
                                .name(ds.getSpecialty().getName())
                                .isPrimary(ds.getIsPrimary())
                                .build())
                        .collect(Collectors.toList());

                dto.setDoctorProfile(UserDetailDTO.DoctorProfileInfo.builder()
                        .id(doctor.getId())
                        .fullName(doctor.getFullName())
                        .dateOfBirth(doctor.getDateOfBirth())
                        .licenseNumber(doctor.getLicenseNumber())
                        .specialization(doctor.getSpecialization())
                        .yearsOfExperience(doctor.getExperienceYears())
                        .bio(doctor.getBio())
                        .consultationFee(doctor.getConsultationFee())
                        .verificationStatus(doctor.getVerificationStatus() != null ? doctor.getVerificationStatus().name() : null)
                        .rating(doctor.getRatingAvg())
                        .reviewCount(doctor.getRatingCount())
                        .specialties(specialties)
                        .build());
            });
        }

        return dto;
    }

    @Override
    @Transactional
    public CreateUserResponseDTO createUser(CreateUserDTO dto, Long currentUserId) {
        log.info("Creating new user with email: {}", dto.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("User", "email", dto.getEmail());
        }

        // Check if phone already exists (if provided)
        if (dto.getPhone() != null && userRepository.existsByPhone(dto.getPhone())) {
            throw new DuplicateResourceException("User", "phone", dto.getPhone());
        }

        // Convert DTO to Entity
        User user = userMapper.toEntity(dto);

        // Hash password
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));

        // Set default values
        if (user.getIsActive() == null) {
            user.setIsActive(true);
        }
        if (user.getIsVerified() == null) {
            user.setIsVerified(false);
        }
        if (user.getFailedLoginCount() == null) {
            user.setFailedLoginCount(0);
        }
        if (user.getTwoFactorEnabled() == null) {
            user.setTwoFactorEnabled(false);
        }

        // Save user first
        user = userRepository.save(user);

        // Assign roles if provided
        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            assignRolesToUser(user, dto.getRoleIds(), currentUserId);
        }

        // Reload user with roles
        Long userId = user.getId();
        user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("User created successfully with ID: {}", user.getId());

        // Build response
        CreateUserResponseDTO response = CreateUserResponseDTO.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .roles(userMapper.mapRolesToStrings(user.getUserRoles()))
                .inviteStatus("not_sent")
                .build();

        // Check if user has DOCTOR role
        boolean isDoctorRole = user.getUserRoles().stream()
                .anyMatch(ur -> "DOCTOR".equalsIgnoreCase(ur.getRole().getName()));

        if (isDoctorRole) {
            // Create Doctor profile
            Doctor doctor = Doctor.builder()
                    .user(user)
                    .fullName(dto.getFullName() != null ? dto.getFullName() : user.getEmail())
                    .specialization(dto.getSpecialization())
                    .experienceYears(parseExperienceYears(dto.getYearsOfExperience()))
                    .bio(buildDoctorBio(dto))
                    .verificationStatus(VerificationStatus.AWAITING_DOCUMENTS)
                    .isAvailable(false)
                    .build();

            doctor = doctorRepository.save(doctor);
            log.info("Doctor profile created with ID: {} for user: {}", doctor.getId(), user.getId());

            // Assign specialties if provided
            if (dto.getSpecialtyIds() != null && !dto.getSpecialtyIds().isEmpty()) {
                assignSpecialtiesToDoctor(doctor, dto.getSpecialtyIds(), dto.getPrimarySpecialtyId());
                doctor = doctorRepository.save(doctor);
            }

            response.setDoctorId(doctor.getId());
            response.setSpecialization(doctor.getSpecialization());
            response.setVerificationStatus(doctor.getVerificationStatus().name());

            // Create staff invite if requested
            if (Boolean.TRUE.equals(dto.getSendInvite())) {
                try {
                    StaffRegistry staffRegistry = StaffRegistry.builder()
                            .email(user.getEmail())
                            .phone(user.getPhone())
                            .fullName(dto.getFullName() != null ? dto.getFullName() : user.getEmail())
                            .expectedRole("DOCTOR")
                            .department(dto.getSpecialization())
                            .status("REGISTERED")
                            .staffCode(generateStaffCode())
                            .invitationToken(UUID.randomUUID().toString())
                            .invitedAt(LocalDateTime.now())
                            .registeredUser(user)
                            .registeredAt(LocalDateTime.now())
                            .notes(dto.getNotes())
                            .build();

                    // Set invitedBy
                    User admin = userRepository.findById(currentUserId).orElse(null);
                    staffRegistry.setInvitedBy(admin);

                    // Check if email already in staff registry
                    if (!staffRegistryRepository.existsByEmail(user.getEmail())) {
                        staffRegistry = staffRegistryRepository.save(staffRegistry);
                        doctor.setStaffRegistry(staffRegistry);
                        doctorRepository.save(doctor);
                        log.info("Staff registry created with ID: {} for doctor: {}", staffRegistry.getId(), doctor.getId());
                    }

                    // Send credential email with login info and verify link
                    try {
                        String verifyToken = jwtService.generateVerificationToken(user.getEmail());
                        String verifyUrl = frontendUrl + "/verify-account?token=" + verifyToken;
                        emailService.sendDoctorCredentialsEmail(
                            user.getEmail(),
                            dto.getFullName() != null ? dto.getFullName() : "Doctor",
                            dto.getPassword(),
                            verifyUrl
                        );
                        response.setInviteStatus("sent");
                        response.setInviteMessage("Invitation email sent successfully");
                    } catch (Exception emailEx) {
                        log.warn("Failed to send invite email to {}: {}", user.getEmail(), emailEx.getMessage());
                        response.setInviteStatus("failed");
                        response.setInviteMessage("User and doctor profile created, but email sending failed");
                    }
                } catch (Exception e) {
                    log.warn("Failed to create staff registry for {}: {}", user.getEmail(), e.getMessage());
                    response.setInviteStatus("failed");
                    response.setInviteMessage("Doctor profile created, but staff registry failed: " + e.getMessage());
                }
            }
        }

        return response;
    }

    private Integer parseExperienceYears(String yearsStr) {
        if (yearsStr == null || yearsStr.trim().isEmpty()) return 0;
        try {
            return Integer.parseInt(yearsStr.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Assign specialties to a doctor, clearing any existing ones.
     * Also updates the legacy specialization string field with the primary specialty name.
     */
    public void assignSpecialtiesToDoctor(Doctor doctor, Set<Long> specialtyIds, Long primarySpecialtyId) {
        List<Specialty> specialties = specialtyRepository.findAllById(specialtyIds);
        if (specialties.isEmpty()) {
            throw new ResourceNotFoundException("No specialties found for the given IDs");
        }

        // Validate primarySpecialtyId is in the set
        if (primarySpecialtyId != null && !specialtyIds.contains(primarySpecialtyId)) {
            throw new IllegalArgumentException("Primary specialty ID must be one of the selected specialties");
        }

        // Clear existing
        doctor.getDoctorSpecialties().clear();

        // Create new join records
        for (Specialty specialty : specialties) {
            boolean isPrimary = specialty.getId().equals(primarySpecialtyId);
            DoctorSpecialty ds = DoctorSpecialty.builder()
                    .doctor(doctor)
                    .specialty(specialty)
                    .isPrimary(isPrimary)
                    .build();
            doctor.getDoctorSpecialties().add(ds);

            if (isPrimary) {
                doctor.setSpecialization(specialty.getName());
            }
        }

        // Fallback: if no primary was set, use the first one
        if (primarySpecialtyId == null && !specialties.isEmpty()) {
            doctor.getDoctorSpecialties().get(0).setIsPrimary(true);
            doctor.setSpecialization(specialties.get(0).getName());
        }
    }

    private String buildDoctorBio(CreateUserDTO dto) {
        StringBuilder bio = new StringBuilder();
        if (dto.getQualification() != null && !dto.getQualification().isEmpty()) {
            bio.append("Qualification: ").append(dto.getQualification());
        }
        if (dto.getSubSpecialization() != null && !dto.getSubSpecialization().isEmpty()) {
            if (bio.length() > 0) bio.append("\n");
            bio.append("Sub-specialization: ").append(dto.getSubSpecialization());
        }
        if (dto.getNotes() != null && !dto.getNotes().isEmpty()) {
            if (bio.length() > 0) bio.append("\n");
            bio.append(dto.getNotes());
        }
        return bio.length() > 0 ? bio.toString() : null;
    }

    private String generateStaffCode() {
        String datePart = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%05d", new java.security.SecureRandom().nextInt(100000));
        return "STAFF-" + datePart + "-" + randomPart;
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long userId, UpdateUserDTO dto) {
        log.info("Updating user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check email uniqueness (if changing email)
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new DuplicateResourceException("User", "email", dto.getEmail());
            }
        }

        // Check phone uniqueness (if changing phone)
        if (dto.getPhone() != null && !dto.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(dto.getPhone())) {
                throw new DuplicateResourceException("User", "phone", dto.getPhone());
            }
        }

        // Update user using MapStruct (only non-null fields)
        userMapper.updateEntityFromDTO(dto, user);

        user = userRepository.save(user);

        // Reload with roles
        Long savedUserId = user.getId();
        user = userRepository.findByIdWithRoles(savedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + savedUserId));

        log.info("User updated successfully: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public UserDTO updateUserStatus(Long userId, StatusDTO dto) {
        log.info("Updating user status for ID: {}, isActive: {}", userId, dto.getIsActive());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setIsActive(dto.getIsActive());

        // If disabling user, also clear any account locks
        if (!dto.getIsActive()) {
            user.setLockedUntil(null);
            user.setFailedLoginCount(0);
        }

        user = userRepository.save(user);

        // Reload with roles
        Long statusUserId = user.getId();
        user = userRepository.findByIdWithRoles(statusUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + statusUserId));

        log.info("User status updated successfully: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public UserDTO assignRoles(Long userId, AssignRolesDTO dto, Long currentUserId) {
        log.info("Assigning roles to user ID: {}, roles: {}", userId, dto.getRoleIds());

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        // Delete all existing roles (clearAutomatically will clear persistence context)
        userRoleRepository.deleteByUserId(userId);

        // Reload user fresh after delete (persistence context was cleared)
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Assign new roles
        assignRolesToUser(user, dto.getRoleIds(), currentUserId);

        // Reload user with new roles
        user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        log.info("Roles assigned successfully to user: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public String resetPassword(Long userId) {
        log.info("Resetting password for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Generate random password (8 characters)
        String newPassword = generateRandomPassword();

        // Hash and save new password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);

        userRepository.save(user);

        log.info("Password reset successfully for user: {}", userId);

        // Send new password to user's email
        emailService.sendHtmlEmail(
            user.getEmail(),
            "MediTech - Your password has been reset",
            buildPasswordResetEmail(user.getEmail(), newPassword)
        );

        return newPassword;
    }

    @Override
    @Transactional
    public void adminChangePassword(Long userId, com.q2k.meditech.dto.AdminChangePasswordDTO dto) {
        log.info("Admin changing password for user ID: {}", userId);

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);

        userRepository.save(user);

        log.info("Password changed successfully by admin for user: {}", userId);
    }

    private String buildPasswordResetEmail(String email, String newPassword) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px'>" +
            "<div style='background:#f8f9fa;border-radius:10px;padding:30px;text-align:center'>" +
            "<h2 style='color:#1a73e8'>MediTech - Password Reset</h2>" +
            "<p style='color:#333'>Hello <strong>" + email + "</strong>,</p>" +
            "<p style='color:#333'>Your password has been reset by an administrator.</p>" +
            "<div style='background:#fff;border:2px dashed #1a73e8;border-radius:8px;padding:15px;margin:20px 0'>" +
            "<p style='margin:0;color:#666;font-size:14px'>Your new temporary password:</p>" +
            "<p style='margin:8px 0 0;font-size:24px;font-weight:bold;color:#1a73e8;letter-spacing:2px'>" + newPassword + "</p>" +
            "</div>" +
            "<p style='color:#e53935;font-weight:bold'>Please log in and change your password in Account Settings immediately.</p>" +
            "<p style='color:#999;font-size:12px'>If you did not request this, please contact support.</p>" +
            "</div></body></html>";
    }

    // ========== HELPER METHODS ==========

    /**
     * Helper method to assign roles to user
     */

    private void assignRolesToUser(User user, Set<Long> roleIds, Long assignedBy) {
        // Validate all roles exist
        List<Role> roles = roleRepository.findByIdIn(roleIds);
        if (roles.size() != roleIds.size()) {
            Set<Long> foundRoleIds = roles.stream()
                    .map(Role::getId)
                    .collect(Collectors.toSet());
            Set<Long> missingRoleIds = roleIds.stream()
                    .filter(id -> !foundRoleIds.contains(id))
                    .collect(Collectors.toSet());
            throw new ResourceNotFoundException("Roles not found with IDs: " + missingRoleIds);
        }

        // Get the user who is assigning roles (for audit trail)
        User assignedByUser = userRepository.findById(assignedBy)
                .orElse(null);

        // Create UserRole entries
        for (Role role : roles) {
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .assignedAt(LocalDateTime.now())
                    .assignedBy(assignedByUser)
                    .build();

            user.addRole(userRole);
            userRoleRepository.save(userRole);
        }
    }

    /**
     * Helper method to generate random password
     */
    private String generateRandomPassword() {
        // Generate 8-character random password
        // Mix of uppercase, lowercase, numbers, and special characters
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid.substring(0, 8);
    }
}