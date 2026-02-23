package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AdminPatientDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.StatusDTO;
import com.q2k.meditech.dto.UpdatePatientDTO;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Patient Management Controller
 * Base path: /api/admin/patients
 */
@RestController
@RequestMapping("/admin/patients")
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@Tag(name = "Admin - Patient Management", description = "APIs for managing patients (Admin only)")
public class AdminPatientController {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/patients - List all patients with filters
     */
    @GetMapping
    @Transactional
    @Operation(summary = "List patients", description = "Get paginated list of patients with optional filters")
    public ResponseEntity<Page<AdminPatientDTO>> listPatients(
            @Parameter(description = "Search by name, email, or phone")
            @RequestParam(required = false) String q,

            @Parameter(description = "Filter by gender (MALE, FEMALE)")
            @RequestParam(required = false) String gender,

            @Parameter(description = "Filter by blood group")
            @RequestParam(required = false) String bloodGroup,

            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive,

            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,

            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "id") String sortBy,

            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortOrder) {

        log.info("GET /admin/patients - q: {}, gender: {}, bloodGroup: {}, isActive: {}", q, gender, bloodGroup, isActive);

        // Auto-sync: create Patient profiles for users with PATIENT role who are missing one
        syncMissingPatientProfiles();

        Sort sort = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<Patient> patients = patientRepository.findAllWithFilters(q, gender, bloodGroup, isActive, pageable);

        Page<AdminPatientDTO> dtos = patients.map(this::toDTO);

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/admin/patients/{id} - Get patient detail
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get patient detail", description = "Get detailed patient info")
    public ResponseEntity<AdminPatientDTO> getPatientDetail(
            @Parameter(description = "Patient ID") @PathVariable Long id) {

        log.info("GET /admin/patients/{}", id);

        Patient patient = patientRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        return ResponseEntity.ok(toDTO(patient));
    }

    /**
     * PUT /api/admin/patients/{id} - Update patient info
     */
    @PutMapping("/{id}")
    @Transactional
    @Operation(summary = "Update patient", description = "Update patient info (admin)")
    public ResponseEntity<AdminPatientDTO> updatePatient(
            @Parameter(description = "Patient ID") @PathVariable Long id,
            @Valid @RequestBody UpdatePatientDTO dto) {

        log.info("PUT /admin/patients/{}", id);

        Patient patient = patientRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        User user = patient.getUser();

        // Update user fields
        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getIsActive() != null) user.setIsActive(dto.getIsActive());

        // Update patient fields
        if (dto.getDateOfBirth() != null) patient.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getGender() != null) patient.setGender(dto.getGender());
        if (dto.getAddress() != null) patient.setAddress(dto.getAddress());
        if (dto.getInsuranceNumber() != null) patient.setInsuranceNumber(dto.getInsuranceNumber());
        if (dto.getInsuranceProvider() != null) patient.setInsuranceProvider(dto.getInsuranceProvider());
        if (dto.getEmergencyContact() != null) patient.setEmergencyContact(dto.getEmergencyContact());
        if (dto.getBloodGroup() != null) patient.setBloodGroup(dto.getBloodGroup());
        if (dto.getAllergies() != null) patient.setAllergies(dto.getAllergies());

        patientRepository.save(patient);

        return ResponseEntity.ok(toDTO(patient));
    }

    /**
     * PATCH /api/admin/patients/{id}/status - Toggle patient account status
     */
    @PatchMapping("/{id}/status")
    @Transactional
    @Operation(summary = "Update patient status", description = "Enable or disable a patient account")
    public ResponseEntity<MessageDTO> updatePatientStatus(
            @Parameter(description = "Patient ID") @PathVariable Long id,
            @Valid @RequestBody StatusDTO dto) {

        log.info("PATCH /admin/patients/{}/status - isActive: {}", id, dto.getIsActive());

        Patient patient = patientRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.getUser().setIsActive(dto.getIsActive());
        patientRepository.save(patient);

        String message = dto.getIsActive()
                ? "Patient activated successfully"
                : "Patient deactivated successfully";

        return ResponseEntity.ok(MessageDTO.success(message));
    }

    // ===== Sync helper =====

    private void syncMissingPatientProfiles() {
        List<User> usersWithoutProfile = userRepository.findUsersWithRoleMissingPatientProfile("PATIENT");
        if (!usersWithoutProfile.isEmpty()) {
            log.info("Syncing {} users with PATIENT role missing patient profile", usersWithoutProfile.size());
            for (User user : usersWithoutProfile) {
                Patient patient = Patient.builder()
                        .user(user)
                        .build();
                patientRepository.save(patient);
                log.info("Created patient profile for user: {} (ID: {})", user.getEmail(), user.getId());
            }
        }
    }

    // ===== Mapper helper =====

    private AdminPatientDTO toDTO(Patient patient) {
        User user = patient.getUser();
        return AdminPatientDTO.builder()
                .patientId(patient.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .address(patient.getAddress())
                .insuranceNumber(patient.getInsuranceNumber())
                .insuranceProvider(patient.getInsuranceProvider())
                .emergencyContact(patient.getEmergencyContact())
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .medicalHistory(patient.getMedicalHistory())
                .totalAppointments((long) patient.getAppointments().size())
                .build();
    }
}
