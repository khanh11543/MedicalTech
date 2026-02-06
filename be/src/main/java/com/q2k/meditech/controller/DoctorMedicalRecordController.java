package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicalRecordCreateDTO;
import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.dto.MedicalRecordUpdateDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Doctor Medical Record Controller
 * Base path: /doctor/medical-records (context path /api is set in application.properties)
 *
 * All endpoints require DOCTOR role (enforced by Security config: /doctor/**)
 */
@RestController
@RequestMapping("/doctor/medical-records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Medical Records", description = "APIs for doctors to manage medical records")
public class DoctorMedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final DoctorRepository doctorRepository;

    /**
     * POST /api/doctor/medical-records
     * Create a new medical record
     */
    @PostMapping
    @Operation(summary = "Create medical record",
            description = "Create a new medical record for a patient after consultation")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Medical record created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor"),
            @ApiResponse(responseCode = "404", description = "Patient or Appointment not found")
    })
    public ResponseEntity<MedicalRecordDTO> createMedicalRecord(
            @Valid @RequestBody MedicalRecordCreateDTO createDTO) {

        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/medical-records - doctorId: {}, patientId: {}", doctorId, createDTO.getPatientId());

        MedicalRecordDTO result = medicalRecordService.createMedicalRecord(doctorId, createDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * PUT /api/doctor/medical-records/{id}
     * Update a medical record
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update medical record",
            description = "Update an existing medical record (doctor can only update own records)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Medical record updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor"),
            @ApiResponse(responseCode = "404", description = "Medical record not found or not owned by doctor")
    })
    public ResponseEntity<MedicalRecordDTO> updateMedicalRecord(
            @Parameter(description = "Medical Record ID") @PathVariable Long id,
            @Valid @RequestBody MedicalRecordUpdateDTO updateDTO) {

        Long doctorId = getCurrentDoctorId();
        log.info("PUT /api/doctor/medical-records/{} - doctorId: {}", id, doctorId);

        MedicalRecordDTO result = medicalRecordService.updateMedicalRecord(doctorId, id, updateDTO);

        return ResponseEntity.ok(result);
    }

    // ========== HELPER METHODS ==========

    /**
     * Get current doctor ID from security context
     */
    private Long getCurrentDoctorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("User not authenticated");
        }

        String username = authentication.getName();

        Long userId;
        try {
            userId = Long.parseLong(username);
        } catch (NumberFormatException e) {
            throw new BadRequestException("Cannot determine user ID from authentication");
        }

        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user ID: " + userId));

        return doctor.getId();
    }
}
