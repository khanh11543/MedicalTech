package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.PrescriptionService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for Doctor to manage prescriptions
 */
@RestController
@RequestMapping("/doctor/prescriptions")
@RequiredArgsConstructor
public class DoctorPrescriptionController {
    
    private final PrescriptionService prescriptionService;
    private final DoctorRepository doctorRepository;
    
    /**
     * Create a new prescription
     * POST /api/doctor/prescriptions
     */
    @PostMapping
    public ResponseEntity<PrescriptionDTO> createPrescription(
            @Valid @RequestBody PrescriptionCreateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // createPrescription expects the logged-in user's ID (not the Doctor entity's PK)
        Long doctorUserId = SecurityUtil.getCurrentUserId();
        PrescriptionDTO result = prescriptionService.createPrescription(dto, doctorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * List all prescriptions for the current doctor
     * GET /api/doctor/prescriptions
     */
    @GetMapping
    public ResponseEntity<Page<PrescriptionDTO>> getDoctorPrescriptions(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String statusFilter,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getDoctorIdFromUser(userDetails);
        
        PrescriptionFilterDTO filter = PrescriptionFilterDTO.builder()
                .doctorId(doctorUserId)
                .status(statusFilter)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .sortBy("prescriptionDate")
                .sortDir("DESC")
                .build();
        
        Page<PrescriptionDTO> result = prescriptionService.getDoctorPrescriptions(
                filter.getDoctorId(), 
                null, 
                null, 
                pageNumber, 
                pageSize
        );
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * View prescription details
     * GET /api/doctor/prescriptions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescription(@PathVariable Long id) {
        PrescriptionDTO result = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(result);
    }

    /**
     * Void (cancel) a prescription owned by the current doctor.
     * PATCH /api/doctor/prescriptions/{id}/void
     * Body: { "reason": "..." }
     */
    @PatchMapping("/{id}/void")
    public ResponseEntity<PrescriptionDTO> voidPrescription(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "No reason provided");
        Long doctorUserId = SecurityUtil.getCurrentUserId();
        PrescriptionDTO result = prescriptionService.voidPrescription(id, doctorUserId, reason);
        return ResponseEntity.ok(result);
    }

    /**
     * Reissue a prescription: creates an ACTIVE copy from an existing one.
     * POST /api/doctor/prescriptions/{id}/reissue
     */
    @PostMapping("/{id}/reissue")
    public ResponseEntity<PrescriptionDTO> reissuePrescription(@PathVariable Long id) {
        Long doctorUserId = SecurityUtil.getCurrentUserId();
        PrescriptionDTO result = prescriptionService.reissuePrescription(id, doctorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // Helper method
    private Long getDoctorIdFromUser(UserDetails userDetails) {
        Long userId = SecurityUtil.getCurrentUserId();
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found for user: " + userId))
                .getId();
    }
}