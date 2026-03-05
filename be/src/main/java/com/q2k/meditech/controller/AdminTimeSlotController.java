package com.q2k.meditech.controller;

import com.q2k.meditech.dto.BulkActionResultDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.dto.timeslot.*;
import com.q2k.meditech.service.TimeSlotService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin Time Slot Management Controller.
 *
 * Endpoints for:
 *  - Slot CRUD (list, detail, create, update, delete)
 *  - Block / Unblock (single + bulk)
 *  - Bulk Create with preview + rollback
 *  - Template CRUD + apply with preview
 *  - Calendar view + KPI statistics
 *  - Clinic Holidays CRUD
 *  - Clinic Working Hours CRUD
 */
@RestController
@RequestMapping("/admin/time-slots")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTimeSlotController {

    private final TimeSlotService timeSlotService;

    // ======================== SLOT LISTING ========================

    /**
     * List time slots with filters + pagination
     * GET /api/admin/time-slots?doctorId=&date=&from=&to=&status=&source=&timeOfDay=&page=&size=
     */
    @GetMapping
    public ResponseEntity<Page<TimeSlotDTO>> getAllTimeSlots(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "50") Integer pageSize) {

        TimeSlotFilterDTO filter = TimeSlotFilterDTO.builder()
                .doctorId(doctorId)
                .date(date != null ? LocalDate.parse(date) : null)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .status(status)
                .source(source)
                .timeOfDay(timeOfDay)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(timeSlotService.getAllTimeSlots(filter));
    }

    /**
     * Get single slot detail
     * GET /api/admin/time-slots/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<TimeSlotDTO> getSlotById(@PathVariable Long id) {
        return ResponseEntity.ok(timeSlotService.getSlotById(id));
    }

    // ======================== SINGLE SLOT CRUD ========================

    /**
     * Create a single slot
     * POST /api/admin/time-slots
     */
    @PostMapping
    public ResponseEntity<TimeSlotDTO> createSingleSlot(@Valid @RequestBody CreateSingleSlotDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        TimeSlotDTO result = timeSlotService.createSingleSlot(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Update a slot (time / note)
     * PUT /api/admin/time-slots/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<TimeSlotDTO> updateSlot(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSlotDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.updateSlot(id, dto, userId));
    }

    /**
     * Delete a slot (AVAILABLE only)
     * DELETE /api/admin/time-slots/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageDTO> deleteSlot(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.deleteSlot(id, userId));
    }

    // ======================== BLOCK / UNBLOCK ========================

    /**
     * Block a single slot
     * POST /api/admin/time-slots/{id}/block
     */
    @PostMapping("/{id}/block")
    public ResponseEntity<TimeSlotDTO> blockSlot(
            @PathVariable Long id,
            @Valid @RequestBody BlockSlotRequestDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.blockSlot(id, dto, userId));
    }

    /**
     * Unblock a single slot
     * POST /api/admin/time-slots/{id}/unblock
     */
    @PostMapping("/{id}/unblock")
    public ResponseEntity<TimeSlotDTO> unblockSlot(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.unblockSlot(id, userId));
    }

    /**
     * Bulk block multiple slots
     * POST /api/admin/time-slots/bulk-block
     */
    @PostMapping("/bulk-block")
    public ResponseEntity<BulkActionResultDTO> bulkBlockSlots(
            @Valid @RequestBody BulkBlockSlotsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.bulkBlockSlots(dto, userId));
    }

    /**
     * Bulk unblock multiple slots
     * POST /api/admin/time-slots/bulk-unblock
     */
    @PostMapping("/bulk-unblock")
    public ResponseEntity<BulkActionResultDTO> bulkUnblockSlots(
            @Valid @RequestBody BulkUnblockSlotsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.bulkUnblockSlots(dto, userId));
    }

    // ======================== BULK CREATE ========================

    /**
     * Preview bulk create (dry-run: show conflicts, holiday skips, total)
     * POST /api/admin/time-slots/bulk-create/preview
     */
    @PostMapping("/bulk-create/preview")
    public ResponseEntity<BulkCreatePreviewDTO> previewBulkCreate(
            @Valid @RequestBody BulkCreateSlotsDTO dto) {
        return ResponseEntity.ok(timeSlotService.previewBulkCreate(dto));
    }

    /**
     * Bulk create time slots
     * POST /api/admin/time-slots/bulk-create
     */
    @PostMapping("/bulk-create")
    public ResponseEntity<BulkActionResultDTO> bulkCreateSlots(
            @Valid @RequestBody BulkCreateSlotsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotService.bulkCreateSlots(dto, userId));
    }

    /**
     * Rollback a bulk-create batch (deletes AVAILABLE slots with batchId)
     * DELETE /api/admin/time-slots/bulk-create/rollback/{batchId}
     */
    @DeleteMapping("/bulk-create/rollback/{batchId}")
    public ResponseEntity<MessageDTO> rollbackBatch(@PathVariable String batchId) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.rollbackBatch(batchId, userId));
    }

    // ======================== TEMPLATE MANAGEMENT ========================

    /**
     * List all templates
     * GET /api/admin/time-slots/templates?activeOnly=false
     */
    @GetMapping("/templates")
    public ResponseEntity<List<TimeSlotTemplateDTO>> getAllTemplates(
            @RequestParam(defaultValue = "false") Boolean activeOnly) {
        return ResponseEntity.ok(timeSlotService.getAllTemplates(activeOnly));
    }

    /**
     * Get template detail
     * GET /api/admin/time-slots/templates/{id}
     */
    @GetMapping("/templates/{id}")
    public ResponseEntity<TimeSlotTemplateDTO> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(timeSlotService.getTemplateById(id));
    }

    /**
     * Create a new template
     * POST /api/admin/time-slots/templates
     */
    @PostMapping("/templates")
    public ResponseEntity<TimeSlotTemplateDTO> createTemplate(@Valid @RequestBody CreateTemplateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotService.createTemplate(dto));
    }

    /**
     * Update a template
     * PUT /api/admin/time-slots/templates/{id}
     */
    @PutMapping("/templates/{id}")
    public ResponseEntity<TimeSlotTemplateDTO> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTemplateDTO dto) {
        return ResponseEntity.ok(timeSlotService.updateTemplate(id, dto));
    }

    /**
     * Delete a template
     * DELETE /api/admin/time-slots/templates/{id}
     */
    @DeleteMapping("/templates/{id}")
    public ResponseEntity<MessageDTO> deleteTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(timeSlotService.deleteTemplate(id));
    }

    /**
     * Preview apply template (dry-run)
     * POST /api/admin/time-slots/templates/{id}/apply/preview
     */
    @PostMapping("/templates/{id}/apply/preview")
    public ResponseEntity<BulkCreatePreviewDTO> previewApplyTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ApplyTemplateDTO dto) {
        return ResponseEntity.ok(timeSlotService.previewApplyTemplate(id, dto));
    }

    /**
     * Apply template to doctors
     * POST /api/admin/time-slots/templates/{id}/apply
     */
    @PostMapping("/templates/{id}/apply")
    public ResponseEntity<BulkActionResultDTO> applyTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ApplyTemplateDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotService.applyTemplate(id, dto, userId));
    }

    // ======================== CALENDAR VIEW ========================

    /**
     * Calendar view - daily slot counts by status
     * GET /api/admin/time-slots/calendar?from=&to=&doctorId=
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarDayDTO>> getCalendarView(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(timeSlotService.getCalendarView(
                LocalDate.parse(from), LocalDate.parse(to), doctorId));
    }

    // ======================== STATISTICS / KPI ========================

    /**
     * Slot statistics / KPI dashboard
     * GET /api/admin/time-slots/statistics?date=&doctorId=
     */
    @GetMapping("/statistics")
    public ResponseEntity<SlotStatisticsDTO> getStatistics(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(timeSlotService.getStatistics(
                date != null ? LocalDate.parse(date) : null, doctorId));
    }

    // ======================== CLINIC HOLIDAYS ========================

    /**
     * List holidays
     * GET /api/admin/time-slots/holidays?year=
     */
    @GetMapping("/holidays")
    public ResponseEntity<List<ClinicHolidayDTO>> getAllHolidays(
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(timeSlotService.getAllHolidays(year));
    }

    /**
     * Create a holiday
     * POST /api/admin/time-slots/holidays
     */
    @PostMapping("/holidays")
    public ResponseEntity<ClinicHolidayDTO> createHoliday(@Valid @RequestBody ClinicHolidayDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(timeSlotService.createHoliday(dto, userId));
    }

    /**
     * Update a holiday
     * PUT /api/admin/time-slots/holidays/{id}
     */
    @PutMapping("/holidays/{id}")
    public ResponseEntity<ClinicHolidayDTO> updateHoliday(
            @PathVariable Long id,
            @Valid @RequestBody ClinicHolidayDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.updateHoliday(id, dto, userId));
    }

    /**
     * Delete a holiday
     * DELETE /api/admin/time-slots/holidays/{id}
     */
    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<MessageDTO> deleteHoliday(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.deleteHoliday(id, userId));
    }

    // ======================== CLINIC WORKING HOURS ========================

    /**
     * List all working hours (Mon-Sun)
     * GET /api/admin/time-slots/working-hours
     */
    @GetMapping("/working-hours")
    public ResponseEntity<List<ClinicWorkingHoursDTO>> getAllWorkingHours() {
        return ResponseEntity.ok(timeSlotService.getAllWorkingHours());
    }

    /**
     * Upsert working hours for a day
     * POST /api/admin/time-slots/working-hours
     */
    @PostMapping("/working-hours")
    public ResponseEntity<ClinicWorkingHoursDTO> upsertWorkingHours(
            @Valid @RequestBody ClinicWorkingHoursDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.upsertWorkingHours(dto, userId));
    }

    /**
     * Delete working hours
     * DELETE /api/admin/time-slots/working-hours/{id}
     */
    @DeleteMapping("/working-hours/{id}")
    public ResponseEntity<MessageDTO> deleteWorkingHours(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(timeSlotService.deleteWorkingHours(id, userId));
    }
}
