package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.service.AppointmentService;
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
    
    // Helper methods - implement based on your security configuration
    private Long getCurrentUserId(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return 1L; // Placeholder
    }
    
    private Long getPatientIdFromUser(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return 1L; // Placeholder
    }
}