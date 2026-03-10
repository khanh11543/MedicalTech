package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for Patient appointment operations
 */
@RestController
@RequestMapping("/patient/appointments")
@RequiredArgsConstructor
public class PatientAppointmentController {
    
    private final AppointmentService appointmentService;
    private final PatientRepository patientRepository;
    
    /**
     * Patient books an appointment
     * POST /api/patient/appointments
     */
    @PostMapping
    public ResponseEntity<AppointmentDTO> bookAppointment(
            @Valid @RequestBody BookAppointmentDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // TODO: Get actual user ID from security context
        Long userId = getCurrentUserId(userDetails);
        
        AppointmentDTO result = appointmentService.bookAppointment(dto, userId, BookedBy.PATIENT);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * Patient views their appointments
     * GET /api/patient/appointments
     */
    @GetMapping
    public ResponseEntity<Page<AppointmentDTO>> getMyAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // TODO: Get patient ID from security context
        Long patientId = getPatientIdFromUser(userDetails);
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .status(status != null ? com.q2k.meditech.entity.enums.AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .from(from != null ? java.time.LocalDate.parse(from) : null)
                .to(to != null ? java.time.LocalDate.parse(to) : null)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();
        
        Page<AppointmentDTO> result = appointmentService.getPatientAppointments(patientId, filter);
        return ResponseEntity.ok(result);
    }
    
    // Helper methods
    private Long getCurrentUserId(UserDetails userDetails) {
        return SecurityUtil.getCurrentUserId();
    }
    
    private Long getPatientIdFromUser(UserDetails userDetails) {
        Long userId = SecurityUtil.getCurrentUserId();
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user: " + userId))
                .getId();
    }
}