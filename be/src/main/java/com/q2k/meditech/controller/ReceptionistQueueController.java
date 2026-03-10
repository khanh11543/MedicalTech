package com.q2k.meditech.controller;

import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.service.QueueManagementService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Receptionist Queue Management (TAB 4).
 * 
 * Endpoints:
 *   VIEW MODES:
 *     GET  /status                    — (legacy) Simple queue status per doctor
 *     GET  /by-doctor                 — Detailed queue per doctor with patient list
 *     GET  /by-room                   — Queue grouped by room
 *     GET  /all-patients              — Flat list of all queued patients
 *
 *   DOCTOR STATUS:
 *     PATCH /doctors/{doctorId}/status — Update doctor status (AVAILABLE/BUSY/BREAK/OFFLINE)
 *     GET   /doctors                   — List all doctors today with queue summary
 *
 *   QUEUE OPERATIONS:
 *     POST  /{doctorId}/call-next     — Call next patient (enhanced)
 *     PATCH /{doctorId}/reorder       — Reorder queue (reason required)
 *     POST  /{doctorId}/add-walk-in   — Add walk-in to queue
 *     POST  /move-doctor              — Move patient between doctors
 *
 *   DISPLAY:
 *     GET  /display/public            — TV public board (no PII)
 *     GET  /display/internal          — Staff screen (with names)
 *
 *   AUDIT:
 *     GET  /audit-log                 — Queue audit events
 *     GET  /{doctorId}/history        — Queue history per doctor
 */
@Slf4j
@RestController
@RequestMapping("/receptionist/queue")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Queue Management", description = "Queue management APIs for receptionist role (TAB 4)")
public class ReceptionistQueueController {

    private final QueueManagementService queueManagementService;

    // ==================== VIEW MODES ====================

    /**
     * D (legacy) - Simple queue status per doctor (counts only).
     * GET /api/receptionist/queue/status
     */
    @GetMapping("/status")
    @Operation(summary = "Get simple queue status",
            description = "Queue status per doctor: waiting/in-progress/completed counts (legacy endpoint)")
    public ResponseEntity<List<DoctorQueueStatusDTO>> getQueueStatus() {
        log.info("GET /receptionist/queue/status");
        // Use getDoctorsList (no patient list) for backward compatibility
        List<DoctorQueueStatusDTO> status = queueManagementService.getDoctorsList();
        return ResponseEntity.ok(status);
    }

    /**
     * #1 - Detailed queue by doctor with waiting patient list.
     * GET /api/receptionist/queue/by-doctor
     */
    @GetMapping("/by-doctor")
    @Operation(summary = "Queue by doctor (detailed)",
            description = "Queue status per doctor with detailed waiting patient list, current patient, wait times")
    public ResponseEntity<List<DoctorQueueStatusDTO>> getQueueByDoctor() {
        log.info("GET /receptionist/queue/by-doctor");
        List<DoctorQueueStatusDTO> result = queueManagementService.getQueueByDoctor();
        return ResponseEntity.ok(result);
    }

    /**
     * #2 - Queue grouped by room.
     * GET /api/receptionist/queue/by-room
     */
    @GetMapping("/by-room")
    @Operation(summary = "Queue by room",
            description = "Queue status grouped by room number. Only doctors with assigned rooms are shown.")
    public ResponseEntity<List<DoctorQueueStatusDTO>> getQueueByRoom() {
        log.info("GET /receptionist/queue/by-room");
        List<DoctorQueueStatusDTO> result = queueManagementService.getQueueByRoom();
        return ResponseEntity.ok(result);
    }

    /**
     * #3 - Flat list of all patients in queue.
     * GET /api/receptionist/queue/all-patients
     */
    @GetMapping("/all-patients")
    @Operation(summary = "All queued patients",
            description = "Flat list of all patients currently in queue across all doctors. Sortable.")
    public ResponseEntity<List<QueuePatientDTO>> getAllQueuedPatients(
            @Parameter(description = "Sort by: queueNumber, waitTime, doctorName, appointmentTime")
            @RequestParam(defaultValue = "queueNumber") String sortBy,
            @Parameter(description = "Sort direction: ASC, DESC")
            @RequestParam(defaultValue = "ASC") String sortDir) {
        log.info("GET /receptionist/queue/all-patients - sort: {} {}", sortBy, sortDir);
        List<QueuePatientDTO> result = queueManagementService.getAllQueuedPatients(sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    // ==================== DOCTOR STATUS ====================

    /**
     * #4 - Update doctor queue status.
     * PATCH /api/receptionist/queue/doctors/{doctorId}/status
     */
    @PatchMapping("/doctors/{doctorId}/status")
    @Operation(summary = "Update doctor status",
            description = "Set doctor queue status: AVAILABLE, BUSY, ON_BREAK, OFFLINE. Optionally assign room.")
    public ResponseEntity<DoctorQueueStatusDTO> updateDoctorStatus(
            @PathVariable Long doctorId,
            @Valid @RequestBody UpdateDoctorStatusDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("PATCH /receptionist/queue/doctors/{}/status - {} by userId: {}", doctorId, dto.getStatus(), userId);
        DoctorQueueStatusDTO result = queueManagementService.updateDoctorStatus(doctorId, dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #5 - List all doctors today with queue summary.
     * GET /api/receptionist/queue/doctors
     */
    @GetMapping("/doctors")
    @Operation(summary = "List doctors with queue status",
            description = "All doctors with appointments today, their status, room, and queue counts")
    public ResponseEntity<List<DoctorQueueStatusDTO>> getDoctorsList() {
        log.info("GET /receptionist/queue/doctors");
        List<DoctorQueueStatusDTO> result = queueManagementService.getDoctorsList();
        return ResponseEntity.ok(result);
    }

    // ==================== QUEUE OPERATIONS ====================

    /**
     * E / #9 - Call next patient (enhanced with notifyMethod, roomNumber).
     * POST /api/receptionist/queue/{doctorId}/call-next
     */
    @PostMapping("/{doctorId}/call-next")
    @Operation(summary = "Call next patient",
            description = "Call the next patient in queue (or specific queue#). Enhanced with display/speaker/SMS notification options.")
    public ResponseEntity<QueueCallResultDTO> callNextPatient(
            @Parameter(description = "Doctor ID") @PathVariable Long doctorId,
            @RequestBody(required = false) CallNextDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("POST /receptionist/queue/{}/call-next - by userId: {}", doctorId, userId);
        QueueCallResultDTO result = queueManagementService.callNextPatient(doctorId, dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #6 - Reorder queue (reason required for audit).
     * PATCH /api/receptionist/queue/{doctorId}/reorder
     */
    @PatchMapping("/{doctorId}/reorder")
    @Operation(summary = "Reorder queue",
            description = "Reorder a doctor's waiting queue. Reason is mandatory (priority/emergency/doctor request).")
    public ResponseEntity<DoctorQueueStatusDTO> reorderQueue(
            @PathVariable Long doctorId,
            @Valid @RequestBody ReorderQueueDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("PATCH /receptionist/queue/{}/reorder - {} items, reason: {}", doctorId, dto.getOrderedAppointmentIds().size(), dto.getReason());
        DoctorQueueStatusDTO result = queueManagementService.reorderQueue(doctorId, dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #7 - Add walk-in patient to queue.
     * POST /api/receptionist/queue/{doctorId}/add-walk-in
     */
    @PostMapping("/{doctorId}/add-walk-in")
    @Operation(summary = "Add walk-in to queue",
            description = "Create a walk-in appointment and immediately add patient to the doctor's queue with CHECKED_IN status.")
    public ResponseEntity<QueueCallResultDTO> addWalkIn(
            @PathVariable Long doctorId,
            @Valid @RequestBody AddWalkInDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("POST /receptionist/queue/{}/add-walk-in - patientId: {}", doctorId, dto.getPatientId());
        QueueCallResultDTO result = queueManagementService.addWalkIn(doctorId, dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * #8 - Move patient to a different doctor.
     * POST /api/receptionist/queue/move-doctor
     */
    @PostMapping("/move-doctor")
    @Operation(summary = "Move patient to another doctor",
            description = "Transfer a CHECKED_IN patient from one doctor's queue to another. Assigns new queue#, logs history.")
    public ResponseEntity<QueueCallResultDTO> moveDoctor(
            @Valid @RequestBody MoveDoctorDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("POST /receptionist/queue/move-doctor - appt: {} to doctor: {}", dto.getAppointmentId(), dto.getToDoctorId());
        QueueCallResultDTO result = queueManagementService.moveDoctor(dto, userId);
        return ResponseEntity.ok(result);
    }

    // ==================== DISPLAY ====================

    /**
     * #10 - Public TV display board (no PII).
     * GET /api/receptionist/queue/display/public
     */
    @GetMapping("/display/public")
    @Operation(summary = "Public queue display",
            description = "TV/public board: shows only queue number + room. NO patient names, NO PII.")
    public ResponseEntity<List<QueueDisplayDTO>> getPublicDisplay() {
        log.info("GET /receptionist/queue/display/public");
        List<QueueDisplayDTO> result = queueManagementService.getPublicDisplay();
        return ResponseEntity.ok(result);
    }

    /**
     * #11 - Internal staff display (with names).
     * GET /api/receptionist/queue/display/internal
     */
    @GetMapping("/display/internal")
    @Operation(summary = "Internal staff display",
            description = "Staff screen: queue number + room + patient name + appointment code.")
    public ResponseEntity<List<QueueDisplayDTO>> getInternalDisplay() {
        log.info("GET /receptionist/queue/display/internal");
        List<QueueDisplayDTO> result = queueManagementService.getInternalDisplay();
        return ResponseEntity.ok(result);
    }

    // ==================== AUDIT ====================

    /**
     * #12 - Queue audit log (all queue events today).
     * GET /api/receptionist/queue/audit-log
     */
    @GetMapping("/audit-log")
    @Operation(summary = "Queue audit log",
            description = "All queue-related events today: calls, reorders, moves, no-shows, walk-ins, status changes.")
    public ResponseEntity<Page<QueueAuditDTO>> getQueueAuditLog(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize) {
        log.info("GET /receptionist/queue/audit-log - page: {}", pageNumber);
        Page<QueueAuditDTO> result = queueManagementService.getQueueAuditLog(pageNumber, pageSize);
        return ResponseEntity.ok(result);
    }

    /**
     * #13 - Queue history for a specific doctor today.
     * GET /api/receptionist/queue/{doctorId}/history
     */
    @GetMapping("/{doctorId}/history")
    @Operation(summary = "Doctor queue history",
            description = "Queue event history for a specific doctor today: who was called when, reorders, moves.")
    public ResponseEntity<List<QueueAuditDTO>> getDoctorQueueHistory(
            @PathVariable Long doctorId) {
        log.info("GET /receptionist/queue/{}/history", doctorId);
        List<QueueAuditDTO> result = queueManagementService.getDoctorQueueHistory(doctorId);
        return ResponseEntity.ok(result);
    }
}
