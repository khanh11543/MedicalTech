package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDashboardDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.service.DoctorDashboardService;
import com.q2k.meditech.service.DoctorProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Doctor Dashboard Controller.
 * Provides overview statistics for doctor's workday.
 * 
 * Base path: /api/doctor/dashboard
 * Security: Requires ROLE_DOCTOR
 */
@RestController
@RequestMapping("/doctor/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Dashboard", description = "Doctor dashboard overview APIs")
public class DoctorDashboardController {

    private final DoctorDashboardService doctorDashboardService;
    private final DoctorProfileService doctorProfileService;

    /**
     * GET /api/doctor/dashboard
     * Returns all dashboard cards and panels for the authenticated doctor.
     */
    @GetMapping
    @Operation(summary = "Get doctor dashboard overview",
               description = "Returns complete dashboard statistics for the authenticated doctor")
    public ResponseEntity<DoctorDashboardDTO> getDashboard() {
        Long userId = doctorProfileService.requireUserId();
        Doctor doctor = doctorProfileService.getOrCreateDoctor(userId);

        log.info("Doctor {} (userId={}) requesting dashboard", doctor.getId(), userId);

        DoctorDashboardDTO dashboard = doctorDashboardService.getDashboard(doctor.getId(), userId);
        return ResponseEntity.ok(dashboard);
    }
}
