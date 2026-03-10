package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for Doctor appointment operations
 */
@RestController
@RequestMapping("/doctor/appointments")
@RequiredArgsConstructor
public class DoctorAppointmentController {
    
    private final AppointmentService appointmentService;
    private final DoctorRepository doctorRepository;
    
    /**
     * Doctor views their appointments
     * GET /api/doctor/appointments
     */
    @GetMapping
    public ResponseEntity<Page<AppointmentDTO>> getMyAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorId = getDoctorIdFromUser(userDetails);
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .status(status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .date(date != null ? LocalDate.parse(date) : null)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();
        
        Page<AppointmentDTO> result = appointmentService.getDoctorAppointments(doctorId, filter);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Doctor confirms an appointment
     * PATCH /api/doctor/appointments/{id}/confirm
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<AppointmentDTO> confirmAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        
        AppointmentDTO result = appointmentService.confirmAppointment(id, null, doctorUserId, "DOCTOR");
        return ResponseEntity.ok(result);
    }
    
    // Helper methods
    private Long getCurrentUserId(UserDetails userDetails) {
        return SecurityUtil.getCurrentUserId();
    }
    
    private Long getDoctorIdFromUser(UserDetails userDetails) {
        Long userId = SecurityUtil.getCurrentUserId();
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found for user: " + userId))
                .getId();
    }
}