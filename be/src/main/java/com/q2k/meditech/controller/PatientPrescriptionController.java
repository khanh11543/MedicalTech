package com.q2k.meditech.controller;

import com.q2k.meditech.dto.PrescriptionDTO;
import com.q2k.meditech.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for Patient to view their prescriptions
 */
@RestController
@RequestMapping("/patient/prescriptions")
@RequiredArgsConstructor
public class PatientPrescriptionController {
    
    private final PrescriptionService prescriptionService;
    
    /**
     * Lấy danh sách đơn thuốc của patient
     * GET /api/patient/prescriptions
     */
    @GetMapping
    public ResponseEntity<Page<PrescriptionDTO>> getMyPrescriptions(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long patientId = getPatientIdFromUser(userDetails);
        
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        
        Page<PrescriptionDTO> result = prescriptionService.getPatientPrescriptions(
                patientId, fromDate, toDate, pageNumber, pageSize);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Xem chi tiết đơn thuốc
     * GET /api/patient/prescriptions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescription(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // TODO: Validate that prescription belongs to this patient
        PrescriptionDTO result = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(result);
    }
    
    // Helper method
    private Long getPatientIdFromUser(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return 1L;
    }
}