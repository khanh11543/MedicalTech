package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.service.PatientProfileService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.q2k.meditech.entity.enums.AppointmentStatus;

/**
 * Controller for Patient appointment operations
 */
@RestController
@RequestMapping("/patient/appointments")
@RequiredArgsConstructor
public class PatientAppointmentController {

    private final AppointmentService appointmentService;
    private final PatientProfileService patientProfileService;
    
    /**
     * Patient books an appointment
     * POST /api/patient/appointments
     */
    @PostMapping
    public ResponseEntity<AppointmentDTO> bookAppointment(
            @Valid @RequestBody BookAppointmentDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        
        // Override patientId from security context — don't trust client-sent value
        Long patientId = patientProfileService.getOrCreatePatientForUser(getCurrentUserId(userDetails)).getId();
        dto.setPatientId(patientId);
        
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
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long patientId = patientProfileService.getOrCreatePatientForUser(getCurrentUserId(userDetails)).getId();
        
        List<AppointmentStatus> statusList = null;
        if (statuses != null && !statuses.isBlank()) {
            statusList = Arrays.stream(statuses.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> AppointmentStatus.valueOf(s.toUpperCase()))
                    .collect(Collectors.toList());
        }
        if (statusList == null && status != null && !status.isBlank()) {
            statusList = Collections.singletonList(AppointmentStatus.valueOf(status.toUpperCase()));
        }
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .status(statusList == null && status != null && !status.isBlank()
                        ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .statuses(statusList)
                .from(from != null && !from.isBlank() ? java.time.LocalDate.parse(from) : null)
                .to(to != null && !to.isBlank() ? java.time.LocalDate.parse(to) : null)
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
    
}