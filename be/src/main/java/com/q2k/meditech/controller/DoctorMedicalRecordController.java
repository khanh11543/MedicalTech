package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.MedicalRecordService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for Doctor Medical Record operations
 * Doctors can view medical records they created for their patients
 */
@RestController
@RequestMapping("/doctor/medical-records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Medical Records", description = "APIs for doctors to view medical records they created")
public class DoctorMedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final DoctorRepository doctorRepository;

    /**
     * Get all medical records created by the doctor
     * GET /api/doctor/medical-records
     */
    @GetMapping
    @Operation(summary = "List my medical records", description = "Get paginated list of medical records created by me")
    public ResponseEntity<Page<MedicalRecordDTO>> getMyMedicalRecords(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long doctorId = getDoctorIdFromUser(userDetails);

        LocalDate parsedFrom = from != null && !from.isBlank() ? LocalDate.parse(from) : null;
        LocalDate parsedTo = to != null && !to.isBlank() ? LocalDate.parse(to) : null;

        log.info("GET /doctor/medical-records for doctorId: {}, from: {}, to: {}, page: {}", 
                doctorId, parsedFrom, parsedTo, pageNumber);

        Page<MedicalRecordDTO> records = medicalRecordService.getDoctorMedicalRecords(
                doctorId, pageNumber, pageSize, parsedFrom, parsedTo);

        return ResponseEntity.ok(records);
    }

    /**
     * Get medical records for a specific patient (created by this doctor)
     * GET /api/doctor/medical-records/patient/{patientId}
     */
    @GetMapping("/patient/{patientId}")
    @Operation(summary = "List medical records for a patient", 
            description = "Get paginated list of medical records for a specific patient that I created")
    public ResponseEntity<Page<MedicalRecordDTO>> getPatientMedicalRecords(
            @Parameter(description = "Patient ID") @PathVariable Long patientId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long doctorId = getDoctorIdFromUser(userDetails);

        log.info("GET /doctor/medical-records/patient/{} for doctorId: {}", patientId, doctorId);

        Page<MedicalRecordDTO> records = medicalRecordService.getDoctorPatientRecords(
                doctorId, patientId, pageNumber, pageSize);

        return ResponseEntity.ok(records);
    }

    /**
     * Get a specific medical record detail
     * GET /api/doctor/medical-records/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get medical record detail", 
            description = "Get detailed information about a specific medical record")
    public ResponseEntity<MedicalRecordDTO> getMedicalRecordDetail(
            @Parameter(description = "Medical Record ID") @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long doctorId = getDoctorIdFromUser(userDetails);

        log.info("GET /doctor/medical-records/{} for doctorId: {}", id, doctorId);

        MedicalRecordDTO record = medicalRecordService.getDoctorMedicalRecord(id, doctorId);

        return ResponseEntity.ok(record);
    }

    /**
     * Get medical record statistics for the doctor
     * GET /api/doctor/medical-records/stats/overview
     */
    @GetMapping("/stats/overview")
    @Operation(summary = "Get medical records statistics", 
            description = "Get overview statistics about my medical records")
    public ResponseEntity<MedicalRecordStatsDTO> getMedicalRecordStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long doctorId = getDoctorIdFromUser(userDetails);

        log.info("GET /doctor/medical-records/stats/overview for doctorId: {}", doctorId);

        Long totalRecords = medicalRecordService.countDoctorRecords(doctorId);

        MedicalRecordStatsDTO stats = MedicalRecordStatsDTO.builder()
                .totalRecords(totalRecords)
                .build();

        return ResponseEntity.ok(stats);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get doctor ID from authenticated user
     */
    private Long getDoctorIdFromUser(UserDetails userDetails) {
        Long userId = SecurityUtil.getCurrentUserId();
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found for user: " + userId))
                .getId();
    }

    // ==================== DTOs ====================

    /**
     * Statistics for doctor's medical records
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class MedicalRecordStatsDTO {
        private Long totalRecords;
    }
}
