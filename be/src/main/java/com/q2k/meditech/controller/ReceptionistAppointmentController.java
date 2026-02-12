package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for Receptionist appointment operations
 */
@RestController
@RequestMapping("/receptionist/appointments")
@RequiredArgsConstructor
public class ReceptionistAppointmentController {
    
    private final AppointmentService appointmentService;
    
    /**
     * Receptionist books an appointment for a patient
     * POST /api/receptionist/appointments
     */
    @PostMapping
    public ResponseEntity<AppointmentDTO> bookAppointment(
            @Valid @RequestBody BookAppointmentDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long receptionistUserId = getCurrentUserId(userDetails);
        
        AppointmentDTO result = appointmentService.bookAppointment(dto, receptionistUserId, BookedBy.RECEPTIONIST);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * Check-in a patient
     * PATCH /api/receptionist/appointments/{id}/check-in
     */
    @PatchMapping("/{id}/check-in")
    public ResponseEntity<AppointmentDTO> checkInPatient(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long receptionistUserId = getCurrentUserId(userDetails);
        
        AppointmentDTO result = appointmentService.checkInPatient(id, receptionistUserId);
        return ResponseEntity.ok(result);
    }
    
    // Helper method
    private Long getCurrentUserId(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return 1L;
    }
}