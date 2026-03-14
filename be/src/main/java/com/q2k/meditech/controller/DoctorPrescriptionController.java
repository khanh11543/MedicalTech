package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.PrescriptionService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for Doctor to manage prescriptions
 */
@RestController
@RequestMapping("/doctor/prescriptions")
@RequiredArgsConstructor
public class DoctorPrescriptionController {
    
    private final PrescriptionService prescriptionService;
    
    /**
     * Create a new prescription
     * POST /api/doctor/prescriptions
     */
    @PostMapping
    public ResponseEntity<PrescriptionDTO> createPrescription(
            @Valid @RequestBody PrescriptionCreateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        PrescriptionDTO result = prescriptionService.createPrescription(dto, doctorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
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
    
    // Helper method
    private Long getCurrentUserId(UserDetails userDetails) {
        return SecurityUtil.getCurrentUserId();
    }
}