package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
            @Valid @RequestBody RescheduleDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        String userRole = SecurityUtil.hasRole("ADMIN") ? "ADMIN" 
                : SecurityUtil.hasRole("DOCTOR") ? "DOCTOR" 
                : SecurityUtil.hasRole("RECEPTIONIST") ? "RECEPTIONIST" 
                : "PATIENT";
        
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
            @Valid @RequestBody CancelDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        String userRole = SecurityUtil.hasRole("ADMIN") ? "ADMIN" 
                : SecurityUtil.hasRole("DOCTOR") ? "DOCTOR" 
                : SecurityUtil.hasRole("RECEPTIONIST") ? "RECEPTIONIST" 
                : "PATIENT";
        
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
}