package com.q2k.meditech.service;

import com.q2k.meditech.dto.BulkActionResultDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.dto.timeslot.*;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for comprehensive Time Slot Management (Admin).
 *
 * Covers:
 *  - Single slot CRUD (create / edit / delete)
 *  - Block / Unblock (single & bulk)
 *  - Bulk create (with preview & conflict handling)
 *  - Template CRUD + apply
 *  - Calendar view & statistics
 *  - Holiday & working-hours rules
 *  - Batch rollback
 */
public interface TimeSlotService {

    // ==================== SLOT LISTING ====================

    Page<TimeSlotDTO> getAllTimeSlots(TimeSlotFilterDTO filter);

    TimeSlotDTO getSlotById(Long slotId);

    // ==================== SINGLE SLOT CRUD ====================

    TimeSlotDTO createSingleSlot(CreateSingleSlotDTO dto, Long userId);

    TimeSlotDTO updateSlot(Long slotId, UpdateSlotDTO dto, Long userId);

    MessageDTO deleteSlot(Long slotId, Long userId);

    // ==================== BLOCK / UNBLOCK ====================

    TimeSlotDTO blockSlot(Long slotId, BlockSlotRequestDTO dto, Long userId);

    TimeSlotDTO unblockSlot(Long slotId, Long userId);

    BulkActionResultDTO bulkBlockSlots(BulkBlockSlotsDTO dto, Long userId);

    BulkActionResultDTO bulkUnblockSlots(BulkUnblockSlotsDTO dto, Long userId);

    // ==================== BULK CREATE ====================

    BulkCreatePreviewDTO previewBulkCreate(BulkCreateSlotsDTO dto);

    BulkActionResultDTO bulkCreateSlots(BulkCreateSlotsDTO dto, Long userId);

    MessageDTO rollbackBatch(String batchId, Long userId);

    // ==================== TEMPLATE MANAGEMENT ====================

    List<TimeSlotTemplateDTO> getAllTemplates(Boolean activeOnly);

    TimeSlotTemplateDTO getTemplateById(Long id);

    TimeSlotTemplateDTO createTemplate(CreateTemplateDTO dto);

    TimeSlotTemplateDTO updateTemplate(Long id, UpdateTemplateDTO dto);

    MessageDTO deleteTemplate(Long id);

    BulkCreatePreviewDTO previewApplyTemplate(Long templateId, ApplyTemplateDTO dto);

    BulkActionResultDTO applyTemplate(Long templateId, ApplyTemplateDTO dto, Long userId);

    // ==================== CALENDAR VIEW ====================

    List<CalendarDayDTO> getCalendarView(LocalDate from, LocalDate to, Long doctorId);

    // ==================== STATISTICS / KPI ====================

    SlotStatisticsDTO getStatistics(LocalDate date, Long doctorId);

    // ==================== HOLIDAYS ====================

    List<ClinicHolidayDTO> getAllHolidays(Integer year);

    ClinicHolidayDTO createHoliday(ClinicHolidayDTO dto, Long userId);

    ClinicHolidayDTO updateHoliday(Long id, ClinicHolidayDTO dto, Long userId);

    MessageDTO deleteHoliday(Long id, Long userId);

    // ==================== CLINIC WORKING HOURS ====================

    List<ClinicWorkingHoursDTO> getAllWorkingHours();

    ClinicWorkingHoursDTO upsertWorkingHours(ClinicWorkingHoursDTO dto, Long userId);

    MessageDTO deleteWorkingHours(Long id, Long userId);
}
