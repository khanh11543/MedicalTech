package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for common appointment operations (Reschedule, Cancel, History)
 * These endpoints can be accessed by multiple roles
 */
@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    
    /**
     * Get appointment by ID
     * GET /api/appointments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointment(@PathVariable Long id) {
        AppointmentDTO result = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Reschedule an appointment
     * PATCH /api/appointments/{id}/reschedule
     * Can be called by Patient, Doctor, Receptionist
     */
    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDTO> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        String userRole = getCurrentUserRole(userDetails);
        
        AppointmentDTO result = appointmentService.rescheduleAppointment(id, dto, userId, userRole);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Cancel an appointment
     * PATCH /api/appointments/{id}/cancel
     * Can be called by Patient, Doctor, Receptionist, Admin
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDTO> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CancelDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        String userRole = getCurrentUserRole(userDetails);
        
        AppointmentDTO result = appointmentService.cancelAppointment(id, dto, userId, userRole);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get appointment history
     * GET /api/appointments/{id}/history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<AppointmentHistoryDTO>> getAppointmentHistory(@PathVariable Long id) {
        List<AppointmentHistoryDTO> result = appointmentService.getAppointmentHistory(id);
        return ResponseEntity.ok(result);
    }
    
    // Helper methods
    private Long getCurrentUserId(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return 1L;
    }
    
    private String getCurrentUserRole(UserDetails userDetails) {
        // TODO: Implement based on your UserDetails implementation
        return "PATIENT";
    }
}