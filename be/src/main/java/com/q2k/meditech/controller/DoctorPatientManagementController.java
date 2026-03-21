package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.DoctorPatientManagementService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for Doctor Patient Management
 * Provides APIs for doctors to view and manage their patient cohort
 */
@RestController
@RequestMapping("/doctor/my-patients")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Patient Management", description = "Doctor patient cohort management (My Patients, Recent, Flags)")
public class DoctorPatientManagementController {

    private final DoctorPatientManagementService patientManagementService;
    private final DoctorRepository doctorRepository;

    // ==================== MY PATIENTS TAB ====================

    /**
     * Get all patients of the doctor with optional search.
     * GET /api/doctor/my-patients
     * 
     * Returns a list of patients who have had appointments with the doctor or have upcoming appointments.
     */
    @GetMapping
    @Operation(summary = "Get my patients", description = "Get all patients with appointments with this doctor")
    public ResponseEntity<PageResponse<DoctorPatientDTO>> getMyPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching my patients - search: {}, page: {}, size: {}", search, pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        // For DISTINCT queries on Patient entity, avoid applying Sort that references appointment fields
        // Just use pagination without explicit sorting
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientDTO> result = patientManagementService.getMyPatients(
                doctorId, search, pageable);

        return ResponseEntity.ok(result);
    }

    /**
     * Get detailed information for a specific patient.
     * GET /api/doctor/my-patients/{patientId}
     *
     * Returns comprehensive patient information including:
     * - Basic demographics
     * - Medical history (allergies, chronic conditions)
     * - Visit history with this doctor
     * - Medical records (last 5)
     * - Prescriptions (last 5)
     * - Upcoming appointments
     */
    @GetMapping("/{patientId}")
    @Operation(summary = "Get patient detail", description = "Get detailed information for a specific patient")
    public ResponseEntity<DoctorPatientDetailDTO> getPatientDetail(
            @PathVariable Long patientId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching patient detail - patientId: {}", patientId);

        Long doctorId = getDoctorIdFromUser(userDetails);

        DoctorPatientDetailDTO result = patientManagementService.getPatientDetail(
                doctorId, patientId);

        return ResponseEntity.ok(result);
    }

    /**
     * Get paginated medical records (from consultations) for a specific patient.
     * GET /api/doctor/my-patients/{patientId}/medical-records
     */
    @GetMapping("/{patientId}/medical-records")
    @Operation(summary = "Get patient medical records", description = "Get paginated medical records from finalized consultations for a specific patient")
    public ResponseEntity<PageResponse<DoctorPatientDetailDTO.MedicalRecordSummaryDTO>> getPatientMedicalRecords(
            @PathVariable Long patientId,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching patient medical records - patientId: {}, page: {}, size: {}", patientId, pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientDetailDTO.MedicalRecordSummaryDTO> result =
                patientManagementService.getPatientMedicalRecords(doctorId, patientId, pageable);

        return ResponseEntity.ok(result);
    }

    // ==================== RECENT TAB ====================

    /**
     * Get recently seen patients (last 30 days).
     * GET /api/doctor/my-patients/recent
     *
     * Returns patients seen in the last 30 days, useful for quick follow-up support.
     */
    @GetMapping("/recent")
    @Operation(summary = "Get recent patients", description = "Get patients seen in the last 30 days for quick follow-up")
    public ResponseEntity<PageResponse<DoctorPatientRecentDTO>> getRecentPatients(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching recent patients - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        // For DISTINCT queries on Patient entity, avoid applying Sort that references appointment fields
        // Just use pagination without explicit sorting
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientRecentDTO> result = patientManagementService.getRecentPatients(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    // ==================== FLAGS TAB ====================

    /**
     * Get patients with clinical flags (allergies or chronic conditions).
     * GET /api/doctor/my-patients/flags
     *
     * Returns patients with allergies or chronic conditions for clinical safety awareness.
     */
    @GetMapping("/flags")
    @Operation(summary = "Get patients with flags", description = "Get patients with allergies or chronic conditions")
    public ResponseEntity<PageResponse<DoctorPatientFlagsDTO>> getPatientsWithFlags(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching flagged patients - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientFlagsDTO> result = patientManagementService.getPatientsWithFlags(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    /**
     * Get patients with allergies only.
     * GET /api/doctor/my-patients/flags/allergies
     */
    @GetMapping("/flags/allergies")
    @Operation(summary = "Get patients with allergies", description = "Get patients with documented allergies")
    public ResponseEntity<PageResponse<DoctorPatientFlagsDTO>> getPatientsWithAllergies(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching patients with allergies - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientFlagsDTO> result = patientManagementService.getPatientsWithAllergies(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    /**
     * Get patients with chronic conditions only.
     * GET /api/doctor/my-patients/flags/chronic-conditions
     */
    @GetMapping("/flags/chronic-conditions")
    @Operation(summary = "Get patients with chronic conditions", description = "Get patients with documented chronic conditions")
    public ResponseEntity<PageResponse<DoctorPatientFlagsDTO>> getPatientsWithChronicConditions(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching patients with chronic conditions - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientFlagsDTO> result = patientManagementService.getPatientsWithChronicConditions(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    /**
     * Get high-risk patients (severe allergies or multiple chronic conditions).
     * GET /api/doctor/my-patients/flags/high-risk
     */
    @GetMapping("/flags/high-risk")
    @Operation(summary = "Get high-risk patients", description = "Get patients with severe allergies or multiple chronic conditions")
    public ResponseEntity<PageResponse<DoctorPatientFlagsDTO>> getHighRiskPatients(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching high-risk patients - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientFlagsDTO> result = patientManagementService.getHighRiskPatients(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    /**
     * Get patients with medication risk (polypharmacy: 2+ active prescriptions).
     * GET /api/doctor/my-patients/flags/medication-risk
     */
    @GetMapping("/flags/medication-risk")
    @Operation(summary = "Get patients with medication risk", description = "Get patients with 2+ active prescriptions (polypharmacy risk)")
    public ResponseEntity<PageResponse<DoctorPatientFlagsDTO>> getPatientsWithMedicationRisk(
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching patients with medication risk - page: {}, size: {}", pageNumber, pageSize);

        Long doctorId = getDoctorIdFromUser(userDetails);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        PageResponse<DoctorPatientFlagsDTO> result = patientManagementService.getPatientsWithMedicationRisk(
                doctorId, pageable);

        return ResponseEntity.ok(result);
    }

    // ==================== STATISTICS ====================

    /**
     * Get cohort statistics.
     * GET /api/doctor/my-patients/stats
     *
     * Returns statistics about the doctor's patient cohort.
     */
    @GetMapping("/stats")
    @Operation(summary = "Get cohort statistics", description = "Get statistics about patient cohort")
    public ResponseEntity<DoctorPatientCohortStatsDTO> getCohortStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Fetching cohort statistics");

        Long doctorId = getDoctorIdFromUser(userDetails);

        DoctorPatientCohortStatsDTO result = patientManagementService.getPatientCohortStats(doctorId);

        return ResponseEntity.ok(result);
    }

    // ==================== HELPER METHODS ====================

    private Long getDoctorIdFromUser(UserDetails userDetails) {
        Long userId = SecurityUtil.getCurrentUserId();
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found for user: " + userId))
                .getId();
    }
}
