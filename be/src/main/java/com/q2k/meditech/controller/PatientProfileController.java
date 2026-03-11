package com.q2k.meditech.controller;

import com.q2k.meditech.dto.PatientProfileDTO;
import com.q2k.meditech.dto.UpdatePatientProfileDTO;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient - Profile", description = "Get and update own patient profile (medical profile)")
public class PatientProfileController {

    private final PatientRepository patientRepository;

    @GetMapping("/profile")
    @Operation(summary = "Get my patient profile", description = "Returns combined user + patient profile for the authenticated patient")
    public ResponseEntity<PatientProfileDTO> getMyProfile() {
        Long userId = SecurityUtil.getCurrentUserId();
        Patient patient = patientRepository.findByUserIdWithUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));
        return ResponseEntity.ok(toDTO(patient));
    }

    @PutMapping("/profile")
    @Transactional
    @Operation(summary = "Update my patient profile", description = "Update full name, phone, date of birth, gender, address, and additional medical info")
    public ResponseEntity<PatientProfileDTO> updateMyProfile(@Valid @RequestBody UpdatePatientProfileDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Patient patient = patientRepository.findByUserIdWithUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));
        User user = patient.getUser();

        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
            patient.setFullName(dto.getFullName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getGender() != null) {
            patient.setGender(dto.getGender());
        }
        if (dto.getAddress() != null) {
            patient.setAddress(dto.getAddress());
        }
        if (dto.getIdNumber() != null) {
            patient.setIdNumber(dto.getIdNumber());
        }
        if (dto.getInsuranceNumber() != null) {
            patient.setInsuranceNumber(dto.getInsuranceNumber());
        }
        if (dto.getInsuranceProvider() != null) {
            patient.setInsuranceProvider(dto.getInsuranceProvider());
        }
        if (dto.getEmergencyContact() != null) {
            patient.setEmergencyContact(dto.getEmergencyContact());
        }
        if (dto.getBloodGroup() != null) {
            patient.setBloodGroup(dto.getBloodGroup());
        }
        if (dto.getAllergies() != null) {
            patient.setAllergies(dto.getAllergies());
        }
        if (dto.getMedicalHistory() != null) {
            patient.setMedicalHistory(dto.getMedicalHistory());
        }

        patient = patientRepository.save(patient);
        log.info("Patient profile updated for user {}", userId);
        return ResponseEntity.ok(toDTO(patient));
    }

    private PatientProfileDTO toDTO(Patient patient) {
        User user = patient.getUser();
        return PatientProfileDTO.builder()
                .userId(user.getId())
                .patientId(patient.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .address(patient.getAddress())
                .idNumber(patient.getIdNumber())
                .insuranceNumber(patient.getInsuranceNumber())
                .insuranceProvider(patient.getInsuranceProvider())
                .emergencyContact(patient.getEmergencyContact())
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .medicalHistory(patient.getMedicalHistory())
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}
