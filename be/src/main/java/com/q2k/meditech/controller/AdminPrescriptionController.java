package com.q2k.meditech.controller;

import com.q2k.meditech.dto.PrescriptionDTO;
import com.q2k.meditech.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for Admin to view all prescriptions
 */
@RestController
@RequestMapping("/admin/prescriptions")
@RequiredArgsConstructor
public class AdminPrescriptionController {
    
    private final PrescriptionService prescriptionService;
    
    /**
     * Lấy danh sách tất cả đơn thuốc với filters
     * GET /api/admin/prescriptions
     * 
     * Query params:
     * - doctorId: Filter by doctor ID (optional)
     * - patientId: Filter by patient ID (optional)
     * - from: Start date (optional, format: yyyy-MM-dd)
     * - to: End date (optional, format: yyyy-MM-dd)
     * - pageNumber: Page number (default: 0)
     * - pageSize: Page size (default: 10)
     */
    @GetMapping
    public ResponseEntity<Page<PrescriptionDTO>> getAllPrescriptions(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        
        Page<PrescriptionDTO> result = prescriptionService.getAllPrescriptions(
                doctorId, patientId, fromDate, toDate, pageNumber, pageSize);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Xem chi tiết đơn thuốc
     * GET /api/admin/prescriptions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescription(@PathVariable Long id) {
        PrescriptionDTO result = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(result);
    }
}
