package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorTodayDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.service.DoctorProfileService;
import com.q2k.meditech.service.DoctorTodayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/doctor/today")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Today", description = "Doctor queue/timeline operations for today")
public class DoctorTodayController {

    private final DoctorTodayService doctorTodayService;
    private final DoctorProfileService doctorProfileService;

    // ============================================================
    // READ
    // ============================================================

    @GetMapping
    @Operation(summary = "Get today's queue and timeline data")
    public ResponseEntity<DoctorTodayDTO> getTodayData() {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        return ResponseEntity.ok(doctorTodayService.getTodayData(doctor.getId()));
    }

    // ============================================================
    // ACTIONS
    // ============================================================

    @PostMapping("/call-next")
    @Operation(summary = "Call next patient in queue")
    public ResponseEntity<Map<String, String>> callNextPatient() {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        doctorTodayService.callNextPatient(doctor.getId(), userId);
        return ResponseEntity.ok(Map.of("message", "Next patient called successfully"));
    }

    @PostMapping("/call/{appointmentId}")
    @Operation(summary = "Call a specific patient")
    public ResponseEntity<Map<String, String>> callPatient(@PathVariable Long appointmentId) {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        doctorTodayService.callPatient(doctor.getId(), appointmentId, userId);
        return ResponseEntity.ok(Map.of("message", "Patient called successfully"));
    }

    @PostMapping("/complete/{appointmentId}")
    @Operation(summary = "Complete current consultation")
    public ResponseEntity<Map<String, String>> completeConsultation(@PathVariable Long appointmentId) {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        doctorTodayService.completeConsultation(doctor.getId(), appointmentId, userId);
        return ResponseEntity.ok(Map.of("message", "Consultation completed"));
    }

    @PostMapping("/skip/{appointmentId}")
    @Operation(summary = "Skip a patient (reason required)")
    public ResponseEntity<Map<String, String>> skipPatient(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> body) {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        String reason = body.get("reason");
        doctorTodayService.skipPatient(doctor.getId(), appointmentId, reason, userId);
        return ResponseEntity.ok(Map.of("message", "Patient skipped"));
    }

    @PostMapping("/no-show/{appointmentId}")
    @Operation(summary = "Mark patient as no-show")
    public ResponseEntity<Map<String, String>> markNoShow(@PathVariable Long appointmentId) {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        doctorTodayService.markNoShow(doctor.getId(), appointmentId, userId);
        return ResponseEntity.ok(Map.of("message", "Patient marked as no-show"));
    }

    @PostMapping("/status")
    @Operation(summary = "Change doctor status (AVAILABLE / ON_BREAK / OFFLINE)")
    public ResponseEntity<Map<String, String>> changeDoctorStatus(@RequestBody Map<String, String> body) {
        Long userId = requireUserId();
        Doctor doctor = requireDoctor(userId);
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            throw new BadRequestException("Status is required");
        }
        doctorTodayService.changeDoctorStatus(doctor.getId(), newStatus, userId);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + newStatus.toUpperCase()));
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private Long requireUserId() {
        return doctorProfileService.requireUserId();
    }

    private Doctor requireDoctor(Long userId) {
        return doctorProfileService.getOrCreateDoctor(userId);
    }
}
