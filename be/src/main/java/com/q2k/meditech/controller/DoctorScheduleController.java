package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.DoctorScheduleService;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Doctor Schedule Controller
 * Base path: /doctor (context path /api is set in application.properties)
 * 
 * All endpoints require DOCTOR role (enforced by Security config)
 * Doctor ID is extracted from authenticated user's doctor profile
 */
@RestController
@RequestMapping("/doctor")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Schedule & Time Slots", description = "APIs for managing doctor schedules and time slots")
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;
    private final DoctorRepository doctorRepository;

    // ========== WEEKLY SCHEDULES ==========

    /**
     * POST /api/doctor/schedules
     * Create a new weekly schedule
     */
    @PostMapping("/schedules")
    @Operation(summary = "Create weekly schedule", description = "Create a new recurring weekly schedule")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Schedule created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or schedule conflict"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<DoctorScheduleDTO> createSchedule(
            @Valid @RequestBody DoctorScheduleDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/schedules - doctorId: {}, dayOfWeek: {}", doctorId, dto.getDayOfWeek());

        DoctorScheduleDTO result = scheduleService.createSchedule(doctorId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * GET /api/doctor/schedules
     * List my schedules (optionally filter by day of week)
     */
    @GetMapping("/schedules")
    @Operation(summary = "List my schedules", description = "Get list of my weekly schedules")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Schedules retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<List<DoctorScheduleDTO>> listMySchedules(
            @Parameter(description = "Filter by day of week (0=Sunday, 6=Saturday)")
            @RequestParam(required = false) Integer dayOfWeek) {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/schedules - doctorId: {}, dayOfWeek: {}", doctorId, dayOfWeek);

        List<DoctorScheduleDTO> schedules = scheduleService.listMySchedules(doctorId, dayOfWeek);

        return ResponseEntity.ok(schedules);
    }

    /**
     * PUT /api/doctor/schedules/{id}
     * Update an existing schedule
     */
    @PutMapping("/schedules/{id}")
    @Operation(summary = "Update schedule", description = "Update an existing weekly schedule")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Schedule updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or schedule conflict"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your schedule"),
            @ApiResponse(responseCode = "404", description = "Schedule not found")
    })
    public ResponseEntity<DoctorScheduleDTO> updateSchedule(
            @Parameter(description = "Schedule ID") @PathVariable Long id,
            @Valid @RequestBody DoctorScheduleDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("PUT /api/doctor/schedules/{} - doctorId: {}", id, doctorId);

        DoctorScheduleDTO result = scheduleService.updateSchedule(doctorId, id, dto);

        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/doctor/schedules/{id}
     * Delete a schedule
     */
    @DeleteMapping("/schedules/{id}")
    @Operation(summary = "Delete schedule", description = "Delete a weekly schedule")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Schedule deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your schedule"),
            @ApiResponse(responseCode = "404", description = "Schedule not found")
    })
    public ResponseEntity<Void> deleteSchedule(
            @Parameter(description = "Schedule ID") @PathVariable Long id) {

        Long doctorId = getCurrentDoctorId();
        log.info("DELETE /api/doctor/schedules/{} - doctorId: {}", id, doctorId);

        scheduleService.deleteSchedule(doctorId, id);

        return ResponseEntity.noContent().build();
    }

    // ========== SCHEDULE EXCEPTIONS ==========

    /**
     * POST /api/doctor/schedule-exceptions
     * Add a schedule exception (OFF/MODIFIED/EXTRA)
     */
    @PostMapping("/schedule-exceptions")
    @Operation(summary = "Add schedule exception",
            description = "Add an exception for a specific date (OFF = day off, MODIFIED = different hours, EXTRA = additional hours)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Exception created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or exception already exists"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<ScheduleExceptionDTO> addScheduleException(
            @Valid @RequestBody ScheduleExceptionDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/schedule-exceptions - doctorId: {}, date: {}, type: {}",
                doctorId, dto.getExceptionDate(), dto.getExceptionType());

        ScheduleExceptionDTO result = scheduleService.addScheduleException(doctorId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * GET /api/doctor/schedule-exceptions
     * List my schedule exceptions
     */
    @GetMapping("/schedule-exceptions")
    @Operation(summary = "List my schedule exceptions", description = "Get list of my schedule exceptions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Exceptions retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<List<ScheduleExceptionDTO>> listMyExceptions() {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/schedule-exceptions - doctorId: {}", doctorId);

        List<ScheduleExceptionDTO> exceptions = scheduleService.listMyExceptions(doctorId);

        return ResponseEntity.ok(exceptions);
    }

    /**
     * DELETE /api/doctor/schedule-exceptions/{id}
     * Delete a schedule exception
     */
    @DeleteMapping("/schedule-exceptions/{id}")
    @Operation(summary = "Delete schedule exception", description = "Delete a schedule exception")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Exception deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your exception"),
            @ApiResponse(responseCode = "404", description = "Exception not found")
    })
    public ResponseEntity<Void> deleteScheduleException(
            @Parameter(description = "Exception ID") @PathVariable Long id) {

        Long doctorId = getCurrentDoctorId();
        log.info("DELETE /api/doctor/schedule-exceptions/{} - doctorId: {}", id, doctorId);

        scheduleService.deleteScheduleException(doctorId, id);

        return ResponseEntity.noContent().build();
    }

    // ========== TIME SLOTS ==========

    /**
     * POST /api/doctor/time-slots/generate
     * Generate time slots based on schedule and exceptions
     */
    @PostMapping("/time-slots/generate")
    @Operation(summary = "Generate time slots",
            description = "Generate time slots for a date range based on weekly schedule and exceptions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Slots generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or no active schedules"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<MessageDTO> generateTimeSlots(
            @Valid @RequestBody GenerateSlotsDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/time-slots/generate - doctorId: {}, from: {}, to: {}",
                doctorId, dto.getStartDate(), dto.getEndDate());

        MessageDTO result = scheduleService.generateTimeSlots(doctorId, dto);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/doctor/time-slots
     * List my time slots for a date range
     */
    @GetMapping("/time-slots")
    @Operation(summary = "List my time slots", description = "Get list of my time slots for a date range")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Slots retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<List<TimeSlotDTO>> listMyTimeSlots(
            @Parameter(description = "Start date") @RequestParam String startDate,
            @Parameter(description = "End date") @RequestParam String endDate) {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/time-slots - doctorId: {}, from: {}, to: {}", doctorId, startDate, endDate);

        GenerateSlotsDTO dto = GenerateSlotsDTO.builder()
                .startDate(java.time.LocalDate.parse(startDate))
                .endDate(java.time.LocalDate.parse(endDate))
                .build();

        List<TimeSlotDTO> slots = scheduleService.listMyTimeSlots(doctorId, dto);

        return ResponseEntity.ok(slots);
    }

    /**
     * PATCH /api/doctor/time-slots/{slotId}/block
     * Block a time slot
     */
    @PatchMapping("/time-slots/{slotId}/block")
    @Operation(summary = "Block time slot", description = "Block a specific time slot")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Slot blocked successfully"),
            @ApiResponse(responseCode = "400", description = "Slot is not available to block"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your slot"),
            @ApiResponse(responseCode = "404", description = "Slot not found")
    })
    public ResponseEntity<TimeSlotDTO> blockSlot(
            @Parameter(description = "Slot ID") @PathVariable Long slotId,
            @RequestBody(required = false) BlockSlotDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("PATCH /api/doctor/time-slots/{}/block - doctorId: {}", slotId, doctorId);

        TimeSlotDTO result = scheduleService.blockSlot(doctorId, slotId, dto != null ? dto : new BlockSlotDTO());

        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/doctor/time-slots/{slotId}/unblock
     * Unblock a time slot
     */
    @PatchMapping("/time-slots/{slotId}/unblock")
    @Operation(summary = "Unblock time slot", description = "Unblock a blocked time slot")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Slot unblocked successfully"),
            @ApiResponse(responseCode = "400", description = "Slot is not blocked"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your slot"),
            @ApiResponse(responseCode = "404", description = "Slot not found")
    })
    public ResponseEntity<TimeSlotDTO> unblockSlot(
            @Parameter(description = "Slot ID") @PathVariable Long slotId) {

        Long doctorId = getCurrentDoctorId();
        log.info("PATCH /api/doctor/time-slots/{}/unblock - doctorId: {}", slotId, doctorId);

        TimeSlotDTO result = scheduleService.unblockSlot(doctorId, slotId);

        return ResponseEntity.ok(result);
    }

    // ========== HELPER METHODS ==========

    /**
     * Get current doctor ID from security context
     * Extracts user ID from authentication and finds associated doctor profile
     */
    private Long getCurrentDoctorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("User not authenticated");
        }

        // Get user ID from principal
        // Assuming the principal contains the user ID or we can get it from username
        String username = authentication.getName();
        
        // For testing purposes, if username is a number, treat it as user ID
        // In production, you should properly extract user ID from JWT claims
        Long userId;
        try {
            userId = Long.parseLong(username);
        } catch (NumberFormatException e) {
            // If not a number, we need to look up by email/username
            throw new BadRequestException("Cannot determine user ID from authentication");
        }

        // Find doctor by user ID
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user ID: " + userId));

        return doctor.getId();
    }
}
