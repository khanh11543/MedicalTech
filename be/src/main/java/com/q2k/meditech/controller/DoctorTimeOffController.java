package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AffectedAppointmentDTO;
import com.q2k.meditech.dto.TimeOffRequestDTO;
import com.q2k.meditech.service.DoctorProfileService;
import com.q2k.meditech.service.TimeOffRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Doctor Time-Off & Breaks API
 * Base path: /api/doctor/time-off
 *
 * All endpoints require DOCTOR role (enforced by Security config).
 * Doctor ID is resolved from the authenticated user's doctor profile.
 */
@RestController
@RequestMapping("/doctor/time-off")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Time Off & Breaks",
     description = "APIs for managing time-off requests, breaks, and blocked time")
public class DoctorTimeOffController {

    private final TimeOffRequestService timeOffService;
    private final DoctorProfileService doctorProfileService;

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------

    @PostMapping
    @Operation(summary = "Create time-off request",
               description = "Submit a new time-off / break / blocked-time request. " +
                             "Auto-approved if no active appointments conflict; " +
                             "moved to PENDING_REVIEW otherwise.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Request created"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden — not a doctor")
    })
    public ResponseEntity<TimeOffRequestDTO> create(@Valid @RequestBody TimeOffRequestDTO dto) {
        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/time-off — doctor={} type={} date={}", doctorId, dto.getType(), dto.getDate());
        TimeOffRequestDTO result = timeOffService.create(doctorId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ----------------------------------------------------------------
    // LIST
    // ----------------------------------------------------------------

    @GetMapping
    @Operation(summary = "List my time-off requests",
               description = "Returns all time-off requests for the authenticated doctor, newest date first.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<TimeOffRequestDTO>> list() {
        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/time-off — doctor={}", doctorId);
        return ResponseEntity.ok(timeOffService.list(doctorId));
    }

    // ----------------------------------------------------------------
    // GET SINGLE
    // ----------------------------------------------------------------

    @GetMapping("/{id}")
    @Operation(summary = "Get time-off request by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Request found"),
            @ApiResponse(responseCode = "404", description = "Not found or does not belong to doctor")
    })
    public ResponseEntity<TimeOffRequestDTO> getById(
            @Parameter(description = "Request ID") @PathVariable Long id) {
        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/time-off/{} — doctor={}", id, doctorId);
        return ResponseEntity.ok(timeOffService.getById(doctorId, id));
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------

    @PutMapping("/{id}")
    @Operation(summary = "Update time-off request",
               description = "Edit a PENDING_REVIEW request (or an APPROVED future request). " +
                             "A fresh conflict check is run after the update.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Updated"),
            @ApiResponse(responseCode = "400", description = "Invalid input or request not editable"),
            @ApiResponse(responseCode = "404", description = "Not found")
    })
    public ResponseEntity<TimeOffRequestDTO> update(
            @Parameter(description = "Request ID") @PathVariable Long id,
            @Valid @RequestBody TimeOffRequestDTO dto) {
        Long doctorId = getCurrentDoctorId();
        log.info("PUT /api/doctor/time-off/{} — doctor={}", id, doctorId);
        return ResponseEntity.ok(timeOffService.update(doctorId, id, dto));
    }

    // ----------------------------------------------------------------
    // CANCEL
    // ----------------------------------------------------------------

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel time-off request",
               description = "Doctor self-cancels a request. " +
                             "Not allowed if the request is already effective (approved + date not in future).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cancelled"),
            @ApiResponse(responseCode = "400", description = "Cannot cancel"),
            @ApiResponse(responseCode = "404", description = "Not found")
    })
    public ResponseEntity<TimeOffRequestDTO> cancel(
            @Parameter(description = "Request ID") @PathVariable Long id) {
        Long doctorId = getCurrentDoctorId();
        log.info("PATCH /api/doctor/time-off/{}/cancel — doctor={}", id, doctorId);
        return ResponseEntity.ok(timeOffService.cancel(doctorId, id));
    }

    // ----------------------------------------------------------------
    // AFFECTED APPOINTMENTS
    // ----------------------------------------------------------------

    @GetMapping("/{id}/affected-appointments")
    @Operation(summary = "List appointments affected by this request",
               description = "Returns appointments that overlap with the time-off window.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned"),
            @ApiResponse(responseCode = "404", description = "Not found")
    })
    public ResponseEntity<List<AffectedAppointmentDTO>> getAffectedAppointments(
            @Parameter(description = "Request ID") @PathVariable Long id) {
        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/time-off/{}/affected-appointments — doctor={}", id, doctorId);
        return ResponseEntity.ok(timeOffService.getAffectedAppointments(doctorId, id));
    }

    // ----------------------------------------------------------------
    // HELPER
    // ----------------------------------------------------------------

    private Long getCurrentDoctorId() {
        return doctorProfileService.requireDoctor().getId();
    }
}
