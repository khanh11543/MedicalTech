package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Patient Medical Record Controller
 * Base path: /patient/medical-records (context path /api is set in application.properties)
 *
 * All endpoints require PATIENT role (enforced by Security config: /patient/**)
 */
@RestController
@RequestMapping("/patient/medical-records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient - Medical Records", description = "APIs for patients to view their medical records")
public class PatientMedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final PatientRepository patientRepository;

    /**
     * GET /api/patient/medical-records
     * List patient's medical records with optional date filtering and pagination
     */
    @GetMapping
    @Operation(summary = "List my medical records",
            description = "Get paginated list of the current patient's medical records with optional date range filter")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Medical records retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a patient")
    })
    public ResponseEntity<Page<MedicalRecordDTO>> getMyMedicalRecords(
            @Parameter(description = "Start date filter (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "End date filter (yyyy-MM-dd)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,

            @Parameter(description = "Page size (default 10, max 100)")
            @RequestParam(defaultValue = "10") int pageSize) {

        Long patientId = getCurrentPatientId();
        log.info("GET /api/patient/medical-records - patientId: {}, from: {}, to: {}, page: {}, size: {}",
                patientId, from, to, pageNumber, pageSize);

        Page<MedicalRecordDTO> result = medicalRecordService.getPatientMedicalRecords(
                patientId, from, to, pageNumber, pageSize);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/patient/medical-records/{id}
     * Get a specific medical record detail
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get medical record detail",
            description = "Get detailed information about a specific medical record of the current patient")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Medical record retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a patient"),
            @ApiResponse(responseCode = "404", description = "Medical record not found")
    })
    public ResponseEntity<MedicalRecordDTO> getMedicalRecordDetail(
            @Parameter(description = "Medical Record ID") @PathVariable Long id) {

        Long patientId = getCurrentPatientId();
        log.info("GET /api/patient/medical-records/{} - patientId: {}", id, patientId);

        MedicalRecordDTO result = medicalRecordService.getPatientRecordDetail(patientId, id);

        return ResponseEntity.ok(result);
    }

    // ========== HELPER METHODS ==========

    /**
     * Get current patient ID from security context
     */
    private Long getCurrentPatientId() {
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

        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user ID: " + userId));

        return patient.getId();
    }
}
