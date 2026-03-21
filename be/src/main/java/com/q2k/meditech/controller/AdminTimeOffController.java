package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AffectedAppointmentDTO;
import com.q2k.meditech.dto.TimeOffRequestDTO;
import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import com.q2k.meditech.service.TimeOffRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin endpoints for managing doctor time-off requests.
 * All routes require ADMIN role; covered globally by SecurityConfig (/admin/**).
 */
@RestController
@RequestMapping("/admin/time-off")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTimeOffController {

    private final TimeOffRequestService timeOffService;

    /**
     * GET /admin/time-off
     * List all time-off requests with optional filters.
     */
    @GetMapping
    public ResponseEntity<List<TimeOffRequestDTO>> list(
            @RequestParam(required = false) TimeOffStatus status,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) TimeOffType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        return ResponseEntity.ok(timeOffService.adminList(status, doctorId, type, dateFrom, dateTo));
    }

    /**
     * GET /admin/time-off/{id}
     * Get detail of a specific request (includes re-computed affected appointments if PENDING_REVIEW).
     */
    @GetMapping("/{id}")
    public ResponseEntity<TimeOffRequestDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(timeOffService.adminGetById(id));
    }

    /**
     * PATCH /admin/time-off/{id}/approve
     * Approve a PENDING_REVIEW (or REJECTED) time-off request.
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<TimeOffRequestDTO> approve(@PathVariable Long id) {
        return ResponseEntity.ok(timeOffService.adminApprove(id));
    }

    /**
     * PATCH /admin/time-off/{id}/reject
     * Reject a request. Body: { "reviewNotes": "..." } (required).
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<TimeOffRequestDTO> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String notes = body == null ? null : body.get("reviewNotes");
        return ResponseEntity.ok(timeOffService.adminReject(id, notes));
    }

    /**
     * GET /admin/time-off/{id}/affected-appointments
     * List appointments that conflict with this time-off request.
     */
    @GetMapping("/{id}/affected-appointments")
    public ResponseEntity<List<AffectedAppointmentDTO>> affectedAppointments(@PathVariable Long id) {
        return ResponseEntity.ok(timeOffService.adminGetAffectedAppointments(id));
    }
}
