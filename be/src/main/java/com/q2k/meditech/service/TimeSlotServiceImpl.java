package com.q2k.meditech.service;

import com.q2k.meditech.dto.BulkActionResultDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.dto.timeslot.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.entity.enums.BlockReason;
import com.q2k.meditech.entity.enums.SlotSource;
import com.q2k.meditech.entity.enums.TimeSlotStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.HttpRequestUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comprehensive Time Slot Management service implementation.
 *
 * Business rules enforced:
 *  - No slot creation in the past
 *  - No overlap with existing slots
 *  - Holiday awareness (skip creation, auto-block)
 *  - Clinic working hours validation
 *  - Status transition rules (see TimeSlotStatus)
 *  - Audit trail via log (integrates with @Auditable AOP)
 *  - Batch rollback support
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TimeSlotServiceImpl implements TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final TimeSlotTemplateRepository templateRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicHolidayRepository holidayRepository;
    private final ClinicWorkingHoursRepository workingHoursRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ActivityLoggingService activityLoggingService;

    private static final String RESOURCE_TYPE_TIME_SLOT = "TIME_SLOT";

    private static final class RequestInfo {
        private final String ipAddress;
        private final String userAgent;

        private RequestInfo(String ipAddress, String userAgent) {
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public String getUserAgent() {
            return userAgent;
        }
    }

    private RequestInfo getRequestInfoSafe() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return new RequestInfo(null, null);
            HttpServletRequest request = attrs.getRequest();
            return new RequestInfo(
                    HttpRequestUtil.getClientIp(request),
                    HttpRequestUtil.getUserAgent(request)
            );
        } catch (Exception e) {
            log.warn("Could not get request info for activity log: {}", e.getMessage());
            return new RequestInfo(null, null);
        }
    }

    // ======================== SLOT LISTING ========================

    @Override
    @Transactional(readOnly = true)
    public Page<TimeSlotDTO> getAllTimeSlots(TimeSlotFilterDTO filter) {
        log.info("Getting time slots with filter: {}", filter);

        List<TimeSlot> slots = timeSlotRepository.findAllWithFilters(
                filter.getDoctorId(),
                filter.getDate(),
                filter.getFrom(),
                filter.getTo(),
                filter.getStatus(),
                filter.getSource());

        // Time-of-day convenience filter
        if (filter.getTimeOfDay() != null) {
            LocalTime morningEnd = LocalTime.of(12, 0);
            boolean morning = "MORNING".equalsIgnoreCase(filter.getTimeOfDay());
            slots = slots.stream()
                    .filter(s -> morning ? s.getStartTime().isBefore(morningEnd)
                                         : !s.getStartTime().isBefore(morningEnd))
                    .collect(Collectors.toList());
        }

        long total = slots.size();
        int start = filter.getPageNumber() * filter.getPageSize();
        int end = Math.min(start + filter.getPageSize(), slots.size());
        List<TimeSlot> pagedSlots = start < slots.size() ? slots.subList(start, end) : Collections.emptyList();

        List<TimeSlotDTO> dtos = pagedSlots.stream().map(this::toDTO).collect(Collectors.toList());
        Pageable pageable = PageRequest.of(filter.getPageNumber(), filter.getPageSize());
        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    @Transactional(readOnly = true)
    public TimeSlotDTO getSlotById(Long slotId) {
        TimeSlot slot = findSlotOrThrow(slotId);
        return toDTO(slot);
    }

    // ======================== SINGLE SLOT CRUD ========================

    @Override
    public TimeSlotDTO createSingleSlot(CreateSingleSlotDTO dto, Long userId) {
        log.info("Creating single slot: doctor={}, date={}, {}-{}", dto.getDoctorId(), dto.getSlotDate(), dto.getStartTime(), dto.getEndTime());

        // Validations
        validateNotInPast(dto.getSlotDate(), dto.getStartTime());
        validateTimeRange(dto.getStartTime(), dto.getEndTime());
        validateWithinWorkingHours(dto.getSlotDate(), dto.getStartTime(), dto.getEndTime());
        validateNotHoliday(dto.getSlotDate());

        Doctor doctor = findDoctorOrThrow(dto.getDoctorId());

        // Overlap check
        List<TimeSlot> overlaps = timeSlotRepository.findOverlappingSlots(
                doctor.getId(), dto.getSlotDate(), dto.getStartTime(), dto.getEndTime(), null);
        if (!overlaps.isEmpty()) {
            throw new BadRequestException("Slot overlaps with existing slot(s): "
                    + overlaps.stream().map(s -> s.getStartTime() + "-" + s.getEndTime() + " (" + s.getStatus() + ")")
                    .collect(Collectors.joining(", ")));
        }

        TimeSlot slot = TimeSlot.builder()
                .doctor(doctor)
                .slotDate(dto.getSlotDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(TimeSlotStatus.AVAILABLE)
                .source(SlotSource.MANUAL)
                .note(dto.getNote())
                .build();

        slot = timeSlotRepository.save(slot);
        log.info("SLOT_CREATED: id={}, doctor={}, date={}, time={}-{}, by user={}",
                slot.getId(), doctor.getId(), dto.getSlotDate(), dto.getStartTime(), dto.getEndTime(), userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.CREATED_TIME_SLOT,
                "Created time slot " + dto.getSlotDate() + " " + dto.getStartTime() + "–" + dto.getEndTime(),
                RESOURCE_TYPE_TIME_SLOT,
                slot.getId(),
                req.getIpAddress(),
                req.getUserAgent()
        );
        return toDTO(slot);
    }

    @Override
    public TimeSlotDTO updateSlot(Long slotId, UpdateSlotDTO dto, Long userId) {
        TimeSlot slot = findSlotOrThrow(slotId);

        if (!slot.isEditable()) {
            throw new BadRequestException("Cannot edit slot with status: " + slot.getStatus()
                    + ". Only AVAILABLE and BLOCKED slots can be edited.");
        }

        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        // High-risk change warning: slot starts within 60 minutes
        LocalDateTime slotDateTime = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        if (slotDateTime.isBefore(LocalDateTime.now().plusMinutes(60)) && !Boolean.TRUE.equals(dto.getConfirmHighRisk())) {
            throw new BadRequestException("HIGH_RISK_CHANGE: This slot starts within 60 minutes. "
                    + "Set confirmHighRisk=true to proceed.");
        }

        // Overlap check (excluding self)
        List<TimeSlot> overlaps = timeSlotRepository.findOverlappingSlots(
                slot.getDoctor().getId(), slot.getSlotDate(), dto.getStartTime(), dto.getEndTime(), slotId);
        if (!overlaps.isEmpty()) {
            throw new BadRequestException("New time overlaps with existing slot(s).");
        }

        String oldTime = slot.getStartTime() + "-" + slot.getEndTime();
        slot.setStartTime(dto.getStartTime());
        slot.setEndTime(dto.getEndTime());
        if (dto.getNote() != null) {
            slot.setNote(dto.getNote());
        }
        slot = timeSlotRepository.save(slot);

        log.info("SLOT_UPDATED: id={}, oldTime={}, newTime={}-{}, by user={}",
                slotId, oldTime, dto.getStartTime(), dto.getEndTime(), userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.UPDATED_TIME_SLOT,
                "Updated time slot #" + slotId + " from " + oldTime + " to " + dto.getStartTime() + "-" + dto.getEndTime(),
                RESOURCE_TYPE_TIME_SLOT,
                slotId,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return toDTO(slot);
    }

    @Override
    public MessageDTO deleteSlot(Long slotId, Long userId) {
        TimeSlot slot = findSlotOrThrow(slotId);

        if (!slot.isDeletable()) {
            throw new BadRequestException("Cannot delete slot with status: " + slot.getStatus()
                    + ". Only AVAILABLE slots can be deleted.");
        }

        String info = String.format("doctor=%d, date=%s, time=%s-%s, source=%s",
                slot.getDoctor().getId(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime(), slot.getSource());

        timeSlotRepository.delete(slot);
        log.info("SLOT_DELETED: id={}, {}, by user={}", slotId, info, userId);

        if (slot.getSource() != SlotSource.MANUAL) {
            log.info("MANUAL_OVERRIDE: deleted a {} slot (id={})", slot.getSource(), slotId);
        }

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.DELETED_TIME_SLOT,
                "Deleted time slot #" + slotId + " (" + info + ")",
                RESOURCE_TYPE_TIME_SLOT,
                slotId,
                req.getIpAddress(),
                req.getUserAgent()
        );

        return MessageDTO.success("Slot deleted successfully");
    }

    // ======================== BLOCK / UNBLOCK ========================

    @Override
    public TimeSlotDTO blockSlot(Long slotId, BlockSlotRequestDTO dto, Long userId) {
        TimeSlot slot = findSlotOrThrow(slotId);

        if (!slot.isAvailable()) {
            if (slot.isBooked()) {
                throw new BadRequestException("Cannot block a BOOKED slot. "
                        + "Go to Appointment Management to reschedule/cancel first.");
            }
            throw new BadRequestException("Cannot block slot with status: " + slot.getStatus());
        }

        BlockReason reason = parseBlockReason(dto.getReason());
        slot.setStatus(TimeSlotStatus.BLOCKED);
        slot.setBlockReason(reason);
        slot.setBlockNote(dto.getNote());
        slot.setBlockUntil(dto.getBlockUntil());
        slot.setBlockedBy(userId);
        slot.setBlockedAt(LocalDateTime.now());
        slot = timeSlotRepository.save(slot);

        log.info("SLOT_BLOCKED: id={}, reason={}, by user={}", slotId, reason, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.BLOCKED_TIME_SLOT,
                "Blocked time slot #" + slotId + ", reason: " + reason,
                RESOURCE_TYPE_TIME_SLOT,
                slotId,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return toDTO(slot);
    }

    @Override
    public TimeSlotDTO unblockSlot(Long slotId, Long userId) {
        TimeSlot slot = findSlotOrThrow(slotId);

        if (!slot.isBlocked()) {
            throw new BadRequestException("Slot is not blocked (current status: " + slot.getStatus() + ")");
        }

        // Validate slot still within working hours
        validateWithinWorkingHours(slot.getSlotDate(), slot.getStartTime(), slot.getEndTime());

        slot.setStatus(TimeSlotStatus.AVAILABLE);
        slot.setBlockReason(null);
        slot.setBlockNote(null);
        slot.setBlockUntil(null);
        slot.setBlockedBy(null);
        slot.setBlockedAt(null);
        slot = timeSlotRepository.save(slot);

        log.info("SLOT_UNBLOCKED: id={}, by user={}", slotId, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.UNBLOCKED_TIME_SLOT,
                "Unblocked time slot #" + slotId,
                RESOURCE_TYPE_TIME_SLOT,
                slotId,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return toDTO(slot);
    }

    @Override
    public BulkActionResultDTO bulkBlockSlots(BulkBlockSlotsDTO dto, Long userId) {
        log.info("Bulk blocking {} slots, reason={}", dto.getTimeSlotIds().size(), dto.getReason());

        BlockReason reason = parseBlockReason(dto.getReason());
        List<TimeSlot> slots = timeSlotRepository.findAllByIds(dto.getTimeSlotIds());
        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (Long slotId : dto.getTimeSlotIds()) {
            Optional<TimeSlot> slotOpt = slots.stream().filter(s -> s.getId().equals(slotId)).findFirst();
            if (slotOpt.isEmpty()) {
                results.add(failItem(slotId, "NOT_FOUND", "Time slot not found"));
                failCount++;
                continue;
            }
            TimeSlot slot = slotOpt.get();
            if (!slot.isAvailable()) {
                String msg = slot.isBooked()
                        ? "Cannot block BOOKED slot - go to Appointment to cancel/reschedule"
                        : "Not available (status: " + slot.getStatus() + ")";
                results.add(failItem(slotId, "NOT_AVAILABLE", msg));
                failCount++;
                continue;
            }
            slot.setStatus(TimeSlotStatus.BLOCKED);
            slot.setBlockReason(reason);
            slot.setBlockNote(dto.getNote());
            slot.setBlockUntil(dto.getBlockUntil());
            slot.setBlockedBy(userId);
            slot.setBlockedAt(LocalDateTime.now());
            timeSlotRepository.save(slot);
            results.add(successItem(slotId, "Blocked"));
            successCount++;
        }

        log.info("BULK_BLOCK: {} blocked, {} failed, by user={}", successCount, failCount, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.BULK_BLOCKED_TIME_SLOTS,
                "Bulk blocked time slots: requested=" + dto.getTimeSlotIds().size() + ", blocked=" + successCount + ", failed=" + failCount,
                RESOURCE_TYPE_TIME_SLOT,
                null,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return buildBulkResult(dto.getTimeSlotIds().size(), successCount, failCount, results,
                String.format("Blocked %d of %d slots", successCount, dto.getTimeSlotIds().size()));
    }

    @Override
    public BulkActionResultDTO bulkUnblockSlots(BulkUnblockSlotsDTO dto, Long userId) {
        log.info("Bulk unblocking {} slots", dto.getTimeSlotIds().size());

        List<TimeSlot> slots = timeSlotRepository.findAllByIds(dto.getTimeSlotIds());
        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (Long slotId : dto.getTimeSlotIds()) {
            Optional<TimeSlot> slotOpt = slots.stream().filter(s -> s.getId().equals(slotId)).findFirst();
            if (slotOpt.isEmpty()) {
                results.add(failItem(slotId, "NOT_FOUND", "Time slot not found"));
                failCount++;
                continue;
            }
            TimeSlot slot = slotOpt.get();
            if (!slot.isBlocked()) {
                results.add(failItem(slotId, "NOT_BLOCKED", "Not blocked (status: " + slot.getStatus() + ")"));
                failCount++;
                continue;
            }
            slot.setStatus(TimeSlotStatus.AVAILABLE);
            slot.setBlockReason(null);
            slot.setBlockNote(null);
            slot.setBlockUntil(null);
            slot.setBlockedBy(null);
            slot.setBlockedAt(null);
            timeSlotRepository.save(slot);
            results.add(successItem(slotId, "Unblocked"));
            successCount++;
        }

        log.info("BULK_UNBLOCK: {} unblocked, {} failed, by user={}", successCount, failCount, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.BULK_UNBLOCKED_TIME_SLOTS,
                "Bulk unblocked time slots: requested=" + dto.getTimeSlotIds().size() + ", unblocked=" + successCount + ", failed=" + failCount,
                RESOURCE_TYPE_TIME_SLOT,
                null,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return buildBulkResult(dto.getTimeSlotIds().size(), successCount, failCount, results,
                String.format("Unblocked %d of %d slots", successCount, dto.getTimeSlotIds().size()));
    }

    // ======================== BULK CREATE ========================

    @Override
    @Transactional(readOnly = true)
    public BulkCreatePreviewDTO previewBulkCreate(BulkCreateSlotsDTO dto) {
        log.info("Preview bulk create: {} doctors, {} to {}", dto.getDoctorIds().size(), dto.getStartDate(), dto.getEndDate());
        return doBulkCreatePreview(dto.getDoctorIds(), dto.getStartDate(), dto.getEndDate(),
                dto.getDaysOfWeek(), dto.getTimeSlots(), dto.getBreakTimes(), dto.getSlotDuration());
    }

    @Override
    public BulkActionResultDTO bulkCreateSlots(BulkCreateSlotsDTO dto, Long userId) {
        log.info("Bulk creating slots: {} doctors, {} to {}, conflictMode={}",
                dto.getDoctorIds().size(), dto.getStartDate(), dto.getEndDate(), dto.getConflictMode());

        // If previewOnly, delegate to preview
        if (Boolean.TRUE.equals(dto.getPreviewOnly())) {
            BulkCreatePreviewDTO preview = previewBulkCreate(dto);
            return BulkActionResultDTO.builder()
                    .totalProcessed(0)
                    .successCount(preview.getTotalSlotsToCreate())
                    .failCount(preview.getConflictCount())
                    .message("Preview only - " + preview.getTotalSlotsToCreate() + " slots to create, "
                            + preview.getConflictCount() + " conflicts")
                    .build();
        }

        String batchId = UUID.randomUUID().toString();
        boolean replaceAvailable = "REPLACE_AVAILABLE".equalsIgnoreCase(dto.getConflictMode());
        Set<LocalDate> holidayDates = new HashSet<>(getHolidayDatesInRange(dto.getStartDate(), dto.getEndDate()));

        // Batch-load all existing slots for all doctors in one query
        List<TimeSlot> allExistingSlots = timeSlotRepository.findByDoctorIdsAndDateRange(
                dto.getDoctorIds(), dto.getStartDate(), dto.getEndDate());
        Map<Long, Map<LocalDate, List<TimeSlot>>> existingMap = new HashMap<>();
        for (TimeSlot ts : allExistingSlots) {
            existingMap
                    .computeIfAbsent(ts.getDoctor().getId(), k -> new HashMap<>())
                    .computeIfAbsent(ts.getSlotDate(), k -> new ArrayList<>())
                    .add(ts);
        }

        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        // Collect ALL slots from all doctors for a single batch insert
        List<Object[]> allSlotsToInsert = new ArrayList<>();
        int successDoctors = 0;
        int failDoctors = 0;
        Map<Long, Integer> doctorSlotCounts = new HashMap<>();

        for (Long doctorId : dto.getDoctorIds()) {
            try {
                Doctor doctor = findDoctorOrThrow(doctorId);
                List<TimeSlot> doctorSlots = collectSlotsForDoctor(
                        doctor, dto.getStartDate(), dto.getEndDate(),
                        dto.getDaysOfWeek(), dto.getTimeSlots(), dto.getBreakTimes(),
                        dto.getSlotDuration(), SlotSource.BULK, batchId, holidayDates);

                // Filter out conflicts in memory
                if (!replaceAvailable && !doctorSlots.isEmpty()) {
                    Map<LocalDate, List<TimeSlot>> doctorExisting = existingMap.getOrDefault(doctorId, Collections.emptyMap());
                    doctorSlots = doctorSlots.stream()
                            .filter(slot -> {
                                List<TimeSlot> daySlots = doctorExisting.getOrDefault(slot.getSlotDate(), Collections.emptyList());
                                return findOverlappingInMemory(daySlots, slot.getStartTime(), slot.getEndTime()).isEmpty();
                            })
                            .collect(Collectors.toList());
                }

                // Convert to raw params for batch insert
                for (TimeSlot slot : doctorSlots) {
                    allSlotsToInsert.add(new Object[]{
                            doctor.getId(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime(),
                            slot.getStatus().name(), slot.getSource().name(), batchId
                    });
                }
                doctorSlotCounts.put(doctorId, doctorSlots.size());
                results.add(successItem(doctorId, "Created " + doctorSlots.size() + " slots"));
                successDoctors++;
            } catch (Exception e) {
                log.error("Error preparing slots for doctor {}", doctorId, e);
                results.add(failItem(doctorId, "CREATE_ERROR", e.getMessage()));
                failDoctors++;
            }
        }

        // Single JDBC batch insert for ALL slots (bypasses Hibernate IDENTITY limitation)
        int totalInserted = 0;
        if (!allSlotsToInsert.isEmpty()) {
            String sql = "INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status, source, batch_id, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            int batchSize = 500;
            for (int i = 0; i < allSlotsToInsert.size(); i += batchSize) {
                List<Object[]> batch = allSlotsToInsert.subList(i, Math.min(i + batchSize, allSlotsToInsert.size()));
                int[] counts = jdbcTemplate.batchUpdate(sql, batch);
                for (int c : counts) totalInserted += (c > 0 ? 1 : 0);
            }
            log.info("JDBC batch inserted {} slots in {} batches", totalInserted, (allSlotsToInsert.size() + batchSize - 1) / batchSize);
        }

        log.info("BULK_SLOTS_CREATED: batchId={}, {} doctors, {} slots, by user={}", batchId, successDoctors, totalInserted, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.BULK_CREATED_TIME_SLOTS,
                "Bulk created time slots: batchId=" + batchId + ", doctors=" + successDoctors + ", slots=" + totalInserted,
                RESOURCE_TYPE_TIME_SLOT,
                null,
                req.getIpAddress(),
                req.getUserAgent()
        );
        BulkActionResultDTO result = buildBulkResult(dto.getDoctorIds().size(), successDoctors, failDoctors, results,
                String.format("Created %d slots for %d doctors. BatchId: %s",
                        totalInserted, successDoctors, batchId));
        return result;
    }

    @Override
    public MessageDTO rollbackBatch(String batchId, Long userId) {
        log.info("Rolling back batch: {}, by user={}", batchId, userId);
        int deleted = timeSlotRepository.deleteAvailableByBatchId(batchId);
        log.info("BATCH_ROLLBACK: batchId={}, deleted {} AVAILABLE slots, by user={}", batchId, deleted, userId);

        // Activity log
        RequestInfo req = getRequestInfoSafe();
        activityLoggingService.log(
                userId,
                ActivityType.ROLLED_BACK_TIME_SLOTS,
                "Rolled back batchId=" + batchId + ", deleted=" + deleted,
                RESOURCE_TYPE_TIME_SLOT,
                null,
                req.getIpAddress(),
                req.getUserAgent()
        );
        return MessageDTO.success("Rolled back " + deleted + " available slots from batch " + batchId);
    }

    // ======================== TEMPLATE MANAGEMENT ========================

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotTemplateDTO> getAllTemplates(Boolean activeOnly) {
        List<TimeSlotTemplate> templates = Boolean.TRUE.equals(activeOnly)
                ? templateRepository.findByIsActiveTrueOrderByTemplateNameAsc()
                : templateRepository.findAllByOrderByTemplateNameAsc();
        return templates.stream().map(this::toTemplateDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimeSlotTemplateDTO getTemplateById(Long id) {
        TimeSlotTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + id));
        return toTemplateDTO(template);
    }

    @Override
    public TimeSlotTemplateDTO createTemplate(CreateTemplateDTO dto) {
        log.info("Creating template: {}", dto.getTemplateName());
        if (templateRepository.existsByTemplateName(dto.getTemplateName())) {
            throw new BadRequestException("Template name already exists: " + dto.getTemplateName());
        }

        TimeSlotTemplate template = TimeSlotTemplate.builder()
                .templateName(dto.getTemplateName())
                .description(dto.getDescription())
                .daysOfWeek(dto.getDaysOfWeek())
                .timeSlots(convertTimeSlots(dto.getTimeSlots()))
                .breakTimes(convertBreakTimes(dto.getBreakTimes()))
                .slotDuration(dto.getSlotDuration())
                .isActive(dto.getIsActive())
                .build();

        template = templateRepository.save(template);
        log.info("TEMPLATE_CREATED: id={}", template.getId());
        return toTemplateDTO(template);
    }

    @Override
    public TimeSlotTemplateDTO updateTemplate(Long id, UpdateTemplateDTO dto) {
        TimeSlotTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + id));
        if (templateRepository.existsByTemplateNameAndIdNot(dto.getTemplateName(), id)) {
            throw new BadRequestException("Template name already exists: " + dto.getTemplateName());
        }

        template.setTemplateName(dto.getTemplateName());
        template.setDescription(dto.getDescription());
        template.setDaysOfWeek(dto.getDaysOfWeek());
        template.setTimeSlots(convertTimeSlots(dto.getTimeSlots()));
        template.setBreakTimes(convertBreakTimes(dto.getBreakTimes()));
        template.setSlotDuration(dto.getSlotDuration());
        template.setIsActive(dto.getIsActive());

        template = templateRepository.save(template);
        log.info("TEMPLATE_UPDATED: id={}", template.getId());
        return toTemplateDTO(template);
    }

    @Override
    public MessageDTO deleteTemplate(Long id) {
        if (!templateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Template not found: " + id);
        }
        templateRepository.deleteById(id);
        log.info("TEMPLATE_DELETED: id={}", id);
        return MessageDTO.success("Template deleted successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public BulkCreatePreviewDTO previewApplyTemplate(Long templateId, ApplyTemplateDTO dto) {
        TimeSlotTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + templateId));

        List<TimeSlotConfigDTO> timeSlotConfigs = convertToTimeSlotConfigs(template.getTimeSlots());
        List<BreakTimeDTO> breakTimeConfigs = convertToBreakTimeConfigs(template.getBreakTimes());

        return doBulkCreatePreview(dto.getDoctorIds(), dto.getStartDate(), dto.getEndDate(),
                template.getDaysOfWeek(), timeSlotConfigs, breakTimeConfigs, template.getSlotDuration());
    }

    @Override
    public BulkActionResultDTO applyTemplate(Long templateId, ApplyTemplateDTO dto, Long userId) {
        log.info("Applying template {} to {} doctors", templateId, dto.getDoctorIds().size());

        TimeSlotTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + templateId));

        if (Boolean.TRUE.equals(dto.getPreviewOnly())) {
            BulkCreatePreviewDTO preview = previewApplyTemplate(templateId, dto);
            return BulkActionResultDTO.builder()
                    .totalProcessed(0)
                    .successCount(preview.getTotalSlotsToCreate())
                    .failCount(preview.getConflictCount())
                    .message("Preview only")
                    .build();
        }

        List<TimeSlotConfigDTO> timeSlotConfigs = convertToTimeSlotConfigs(template.getTimeSlots());
        List<BreakTimeDTO> breakTimeConfigs = convertToBreakTimeConfigs(template.getBreakTimes());

        String batchId = UUID.randomUUID().toString();
        boolean replaceAvailable = Boolean.TRUE.equals(dto.getOverwriteExisting())
                || "REPLACE_AVAILABLE".equalsIgnoreCase(dto.getConflictMode());
        Set<LocalDate> holidayDates = new HashSet<>(getHolidayDatesInRange(dto.getStartDate(), dto.getEndDate()));

        // Batch-load all existing slots for all doctors in one query
        List<TimeSlot> allExistingSlots = timeSlotRepository.findByDoctorIdsAndDateRange(
                dto.getDoctorIds(), dto.getStartDate(), dto.getEndDate());
        Map<Long, Map<LocalDate, List<TimeSlot>>> existingMap = new HashMap<>();
        for (TimeSlot ts : allExistingSlots) {
            existingMap
                    .computeIfAbsent(ts.getDoctor().getId(), k -> new HashMap<>())
                    .computeIfAbsent(ts.getSlotDate(), k -> new ArrayList<>())
                    .add(ts);
        }

        List<BulkActionResultDTO.ItemResult> results = new ArrayList<>();
        List<Object[]> allSlotsToInsert = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (Long doctorId : dto.getDoctorIds()) {
            try {
                Doctor doctor = findDoctorOrThrow(doctorId);
                if (replaceAvailable) {
                    timeSlotRepository.deleteAvailableSlotsByDoctorIdAndDateRange(
                            doctor.getId(), dto.getStartDate(), dto.getEndDate());
                }
                List<TimeSlot> doctorSlots = collectSlotsForDoctor(
                        doctor, dto.getStartDate(), dto.getEndDate(),
                        template.getDaysOfWeek(), timeSlotConfigs, breakTimeConfigs,
                        template.getSlotDuration(), SlotSource.TEMPLATE, batchId, holidayDates);

                // Filter out conflicts in memory
                if (!replaceAvailable && !doctorSlots.isEmpty()) {
                    Map<LocalDate, List<TimeSlot>> doctorExisting = existingMap.getOrDefault(doctorId, Collections.emptyMap());
                    doctorSlots = doctorSlots.stream()
                            .filter(slot -> {
                                List<TimeSlot> daySlots = doctorExisting.getOrDefault(slot.getSlotDate(), Collections.emptyList());
                                return findOverlappingInMemory(daySlots, slot.getStartTime(), slot.getEndTime()).isEmpty();
                            })
                            .collect(Collectors.toList());
                }

                for (TimeSlot slot : doctorSlots) {
                    allSlotsToInsert.add(new Object[]{
                            doctor.getId(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime(),
                            slot.getStatus().name(), slot.getSource().name(), batchId
                    });
                }
                results.add(successItem(doctorId, "Applied template, created " + doctorSlots.size() + " slots"));
                successCount++;
            } catch (Exception e) {
                log.error("Error applying template to doctor {}", doctorId, e);
                results.add(failItem(doctorId, "APPLY_ERROR", e.getMessage()));
                failCount++;
            }
        }

        // Single JDBC batch insert for ALL slots
        int totalInserted = 0;
        if (!allSlotsToInsert.isEmpty()) {
            String sql = "INSERT INTO time_slots (doctor_id, slot_date, start_time, end_time, status, source, batch_id, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            int batchSize = 500;
            for (int i = 0; i < allSlotsToInsert.size(); i += batchSize) {
                List<Object[]> batch = allSlotsToInsert.subList(i, Math.min(i + batchSize, allSlotsToInsert.size()));
                int[] counts = jdbcTemplate.batchUpdate(sql, batch);
                for (int c : counts) totalInserted += (c > 0 ? 1 : 0);
            }
        }

        log.info("TEMPLATE_APPLIED: templateId={}, batchId={}, {} doctors, {} slots, by user={}",
                templateId, batchId, successCount, totalInserted, userId);
        return buildBulkResult(dto.getDoctorIds().size(), successCount, failCount, results,
                String.format("Applied template: %d slots for %d doctors. BatchId: %s",
                        totalInserted, successCount, batchId));
    }

    // ======================== CALENDAR VIEW ========================

    @Override
    @Transactional(readOnly = true)
    public List<CalendarDayDTO> getCalendarView(LocalDate from, LocalDate to, Long doctorId) {
        log.info("Calendar view: {} to {}, doctor={}", from, to, doctorId);

        List<Object[]> rows = timeSlotRepository.countByDateAndStatus(from, to, doctorId);

        // Build map: date -> (status -> count)
        Map<LocalDate, Map<String, Long>> dateMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            String status = row[1].toString();
            Long count = (Long) row[2];
            dateMap.computeIfAbsent(date, k -> new HashMap<>()).put(status, count);
        }

        // Fill all dates in range
        List<CalendarDayDTO> result = new ArrayList<>();
        LocalDate current = from;
        while (!current.isAfter(to)) {
            Map<String, Long> statusCounts = dateMap.getOrDefault(current, Collections.emptyMap());
            int available = statusCounts.getOrDefault("AVAILABLE", 0L).intValue();
            int booked = statusCounts.getOrDefault("BOOKED", 0L).intValue();
            int blocked = statusCounts.getOrDefault("BLOCKED", 0L).intValue();
            int completed = statusCounts.getOrDefault("COMPLETED", 0L).intValue();
            int reserved = statusCounts.getOrDefault("RESERVED", 0L).intValue();
            int total = available + booked + blocked + completed + reserved;

            result.add(CalendarDayDTO.builder()
                    .date(current)
                    .totalSlots(total)
                    .availableSlots(available)
                    .bookedSlots(booked)
                    .blockedSlots(blocked)
                    .completedSlots(completed)
                    .reservedSlots(reserved)
                    .build());
            current = current.plusDays(1);
        }
        return result;
    }

    // ======================== STATISTICS / KPI ========================

    @Override
    @Transactional(readOnly = true)
    public SlotStatisticsDTO getStatistics(LocalDate date, Long doctorId) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("Statistics for date={}, doctor={}", targetDate, doctorId);

        List<Object[]> rows = timeSlotRepository.countByStatusForDate(targetDate, doctorId);

        long available = 0, booked = 0, blocked = 0, completed = 0, reserved = 0;
        for (Object[] row : rows) {
            String status = row[0].toString();
            long count = (Long) row[1];
            switch (status) {
                case "AVAILABLE": available = count; break;
                case "BOOKED": booked = count; break;
                case "BLOCKED": blocked = count; break;
                case "COMPLETED": completed = count; break;
                case "RESERVED": reserved = count; break;
            }
        }
        long total = available + booked + blocked + completed + reserved;
        double utilization = total > 0 ? (double) booked / total * 100.0 : 0.0;

        // Lowest availability doctor
        String lowestDoctor = null;
        Long lowestDoctorId = null;
        long lowestCount = Long.MAX_VALUE;
        List<Object[]> perDoctor = timeSlotRepository.countAvailablePerDoctorForDate(targetDate);
        if (!perDoctor.isEmpty()) {
            Object[] first = perDoctor.get(0);
            lowestDoctorId = (Long) first[0];
            lowestDoctor = (String) first[1];
            lowestCount = (Long) first[2];
        }

        return SlotStatisticsDTO.builder()
                .totalSlots(total)
                .availableSlots(available)
                .bookedSlots(booked)
                .blockedSlots(blocked)
                .completedSlots(completed)
                .reservedSlots(reserved)
                .utilizationRate(Math.round(utilization * 100.0) / 100.0)
                .lowestAvailabilityDoctor(lowestDoctor)
                .lowestAvailabilityDoctorId(lowestDoctorId)
                .lowestAvailabilityCount(lowestCount == Long.MAX_VALUE ? 0 : lowestCount)
                .build();
    }

    // ======================== HOLIDAYS ========================

    @Override
    @Transactional(readOnly = true)
    public List<ClinicHolidayDTO> getAllHolidays(Integer year) {
        List<ClinicHoliday> holidays = year != null
                ? holidayRepository.findByYearAndIsActiveTrueOrderByHolidayDateAsc(year)
                : holidayRepository.findAllByOrderByHolidayDateAsc();
        return holidays.stream().map(this::toHolidayDTO).collect(Collectors.toList());
    }

    @Override
    public ClinicHolidayDTO createHoliday(ClinicHolidayDTO dto, Long userId) {
        if (holidayRepository.existsByHolidayDate(dto.getHolidayDate())) {
            throw new BadRequestException("Holiday already exists for date: " + dto.getHolidayDate());
        }

        ClinicHoliday holiday = ClinicHoliday.builder()
                .holidayDate(dto.getHolidayDate())
                .name(dto.getName())
                .description(dto.getDescription())
                .autoBlockSlots(dto.getAutoBlockSlots())
                .preventSlotCreation(dto.getPreventSlotCreation())
                .isActive(dto.getIsActive())
                .build();
        holiday = holidayRepository.save(holiday);

        // Auto-block existing AVAILABLE slots on this date if flag is set
        if (Boolean.TRUE.equals(dto.getAutoBlockSlots())) {
            autoBlockSlotsForDate(dto.getHolidayDate(), userId);
        }

        log.info("HOLIDAY_CREATED: date={}, name={}, by user={}", dto.getHolidayDate(), dto.getName(), userId);
        return toHolidayDTO(holiday);
    }

    @Override
    public ClinicHolidayDTO updateHoliday(Long id, ClinicHolidayDTO dto, Long userId) {
        ClinicHoliday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found: " + id));

        holiday.setHolidayDate(dto.getHolidayDate());
        holiday.setName(dto.getName());
        holiday.setDescription(dto.getDescription());
        holiday.setAutoBlockSlots(dto.getAutoBlockSlots());
        holiday.setPreventSlotCreation(dto.getPreventSlotCreation());
        holiday.setIsActive(dto.getIsActive());
        holiday = holidayRepository.save(holiday);

        log.info("HOLIDAY_UPDATED: id={}, by user={}", id, userId);
        return toHolidayDTO(holiday);
    }

    @Override
    public MessageDTO deleteHoliday(Long id, Long userId) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday not found: " + id);
        }
        holidayRepository.deleteById(id);
        log.info("HOLIDAY_DELETED: id={}, by user={}", id, userId);
        return MessageDTO.success("Holiday deleted successfully");
    }

    // ======================== CLINIC WORKING HOURS ========================

    @Override
    @Transactional(readOnly = true)
    public List<ClinicWorkingHoursDTO> getAllWorkingHours() {
        return workingHoursRepository.findAllByOrderByDayOfWeekAsc().stream()
                .map(this::toWorkingHoursDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ClinicWorkingHoursDTO upsertWorkingHours(ClinicWorkingHoursDTO dto, Long userId) {
        ClinicWorkingHours entity = workingHoursRepository.findByDayOfWeek(dto.getDayOfWeek())
                .orElse(new ClinicWorkingHours());

        entity.setDayOfWeek(dto.getDayOfWeek());
        entity.setOpenTime(dto.getOpenTime());
        entity.setCloseTime(dto.getCloseTime());
        entity.setIsOpen(dto.getIsOpen());
        entity.setDayName(DayOfWeek.of(dto.getDayOfWeek()).getDisplayName(TextStyle.FULL, Locale.US));
        entity = workingHoursRepository.save(entity);

        log.info("WORKING_HOURS_UPSERT: day={}, by user={}", dto.getDayOfWeek(), userId);
        return toWorkingHoursDTO(entity);
    }

    @Override
    public MessageDTO deleteWorkingHours(Long id, Long userId) {
        if (!workingHoursRepository.existsById(id)) {
            throw new ResourceNotFoundException("Working hours not found: " + id);
        }
        workingHoursRepository.deleteById(id);
        log.info("WORKING_HOURS_DELETED: id={}, by user={}", id, userId);
        return MessageDTO.success("Working hours deleted successfully");
    }

    // ================================================================
    //                       PRIVATE HELPERS
    // ================================================================

    private TimeSlot findSlotOrThrow(Long slotId) {
        return timeSlotRepository.findByIdWithDoctor(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Time slot not found: " + slotId));
    }

    private Doctor findDoctorOrThrow(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByUserId(doctorId))
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));
    }

    // ---- Validation helpers ----

    private void validateNotInPast(LocalDate date, LocalTime time) {
        LocalDateTime slotDt = LocalDateTime.of(date, time);
        if (slotDt.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot create slot in the past: " + slotDt);
        }
    }

    private void validateTimeRange(LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("End time must be after start time: " + start + " - " + end);
        }
    }

    private void validateWithinWorkingHours(LocalDate date, LocalTime start, LocalTime end) {
        int dow = date.getDayOfWeek().getValue(); // 1=Mon
        Optional<ClinicWorkingHours> whOpt = workingHoursRepository.findByDayOfWeek(dow);
        if (whOpt.isPresent()) {
            ClinicWorkingHours wh = whOpt.get();
            if (!wh.getIsOpen()) {
                throw new BadRequestException("Clinic is closed on " + date.getDayOfWeek());
            }
            if (start.isBefore(wh.getOpenTime()) || end.isAfter(wh.getCloseTime())) {
                throw new BadRequestException(
                        String.format("Slot %s-%s is outside clinic hours (%s-%s) on %s",
                                start, end, wh.getOpenTime(), wh.getCloseTime(), date.getDayOfWeek()));
            }
        }
        // If no working hours defined, allow any time
    }

    private void validateNotHoliday(LocalDate date) {
        Optional<ClinicHoliday> holiday = holidayRepository.findByHolidayDate(date);
        if (holiday.isPresent() && Boolean.TRUE.equals(holiday.get().getIsActive())
                && Boolean.TRUE.equals(holiday.get().getPreventSlotCreation())) {
            throw new BadRequestException("Cannot create slot on holiday: " + holiday.get().getName()
                    + " (" + date + ")");
        }
    }

    private List<LocalDate> getHolidayDatesInRange(LocalDate from, LocalDate to) {
        return holidayRepository.findBlockedDatesInRange(from, to);
    }

    private void autoBlockSlotsForDate(LocalDate date, Long userId) {
        List<TimeSlot> available = timeSlotRepository.findAvailableSlotsByDate(date);
        for (TimeSlot slot : available) {
            slot.setStatus(TimeSlotStatus.BLOCKED);
            slot.setBlockReason(BlockReason.HOLIDAY);
            slot.setBlockNote("Auto-blocked due to holiday");
            slot.setBlockedBy(userId);
            slot.setBlockedAt(LocalDateTime.now());
        }
        if (!available.isEmpty()) {
            timeSlotRepository.saveAll(available);
            log.info("AUTO_BLOCK_HOLIDAY: blocked {} slots on {}", available.size(), date);
        }
    }

    private BlockReason parseBlockReason(String reason) {
        try {
            return BlockReason.valueOf(reason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid block reason: " + reason
                    + ". Valid values: VACATION, MEETING, EMERGENCY, TRAINING, PERSONAL, HOLIDAY, OTHER");
        }
    }

    // ---- Bulk create core logic ----

    /**
     * Generate slot objects for a doctor without saving or filtering conflicts.
     * Used by optimized bulkCreateSlots to collect all slots before a single JDBC batch insert.
     */
    private List<TimeSlot> collectSlotsForDoctor(Doctor doctor, LocalDate startDate, LocalDate endDate,
                                                  List<String> daysOfWeek, List<TimeSlotConfigDTO> timeSlotConfigs,
                                                  List<BreakTimeDTO> breakTimes, Integer slotDuration,
                                                  SlotSource source, String batchId, Set<LocalDate> holidayDates) {
        Set<String> allowedDays = new HashSet<>(daysOfWeek.stream()
                .map(String::toUpperCase).collect(Collectors.toList()));
        List<TimeSlot> slots = new ArrayList<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            if (holidayDates.contains(currentDate) || currentDate.isBefore(LocalDate.now())) {
                currentDate = currentDate.plusDays(1);
                continue;
            }
            String dayName = currentDate.getDayOfWeek().name();
            if (allowedDays.contains(dayName)) {
                for (TimeSlotConfigDTO config : timeSlotConfigs) {
                    slots.addAll(generateSlotsForTimeRange(
                            doctor, currentDate, config.getStartTime(), config.getEndTime(),
                            slotDuration, breakTimes, source, batchId));
                }
            }
            currentDate = currentDate.plusDays(1);
        }
        return slots;
    }

    private int createSlotsForDoctor(Doctor doctor, LocalDate startDate, LocalDate endDate,
                                     List<String> daysOfWeek, List<TimeSlotConfigDTO> timeSlotConfigs,
                                     List<BreakTimeDTO> breakTimes, Integer slotDuration,
                                     SlotSource source, String batchId,
                                     boolean replaceAvailable, Set<LocalDate> holidayDates) {

        Set<String> allowedDays = new HashSet<>(daysOfWeek.stream()
                .map(String::toUpperCase).collect(Collectors.toList()));
        List<TimeSlot> slotsToCreate = new ArrayList<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            if (holidayDates.contains(currentDate) || currentDate.isBefore(LocalDate.now())) {
                currentDate = currentDate.plusDays(1);
                continue;
            }

            String dayName = currentDate.getDayOfWeek().name();

            if (allowedDays.contains(dayName)) {
                for (TimeSlotConfigDTO config : timeSlotConfigs) {
                    List<TimeSlot> daySlots = generateSlotsForTimeRange(
                            doctor, currentDate, config.getStartTime(), config.getEndTime(),
                            slotDuration, breakTimes, source, batchId);
                    slotsToCreate.addAll(daySlots);
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        // If not replacing, filter out overlapping slots (skip conflicts) - batch query
        if (!replaceAvailable && !slotsToCreate.isEmpty()) {
            List<TimeSlot> existingSlots = timeSlotRepository.findByDoctorIdAndDateRange(
                    doctor.getId(), startDate, endDate);
            // Index existing slots by date for fast in-memory lookup
            Map<LocalDate, List<TimeSlot>> existingByDate = new HashMap<>();
            for (TimeSlot ts : existingSlots) {
                existingByDate.computeIfAbsent(ts.getSlotDate(), k -> new ArrayList<>()).add(ts);
            }
            slotsToCreate = slotsToCreate.stream()
                    .filter(slot -> {
                        List<TimeSlot> daySlots = existingByDate.getOrDefault(slot.getSlotDate(), Collections.emptyList());
                        return findOverlappingInMemory(daySlots, slot.getStartTime(), slot.getEndTime()).isEmpty();
                    })
                    .collect(Collectors.toList());
        }

        if (!slotsToCreate.isEmpty()) {
            timeSlotRepository.saveAll(slotsToCreate);
        }
        return slotsToCreate.size();
    }

    private List<TimeSlot> generateSlotsForTimeRange(Doctor doctor, LocalDate date,
                                                     LocalTime startTime, LocalTime endTime,
                                                     Integer slotDuration, List<BreakTimeDTO> breakTimes,
                                                     SlotSource source, String batchId) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime current = startTime;

        while (current.plusMinutes(slotDuration).compareTo(endTime) <= 0) {
            LocalTime slotEnd = current.plusMinutes(slotDuration);

            boolean isBreakTime = false;
            if (breakTimes != null) {
                for (BreakTimeDTO bt : breakTimes) {
                    if (isOverlap(current, slotEnd, bt.getStartTime(), bt.getEndTime())) {
                        isBreakTime = true;
                        break;
                    }
                }
            }

            if (!isBreakTime) {
                slots.add(TimeSlot.builder()
                        .doctor(doctor)
                        .slotDate(date)
                        .startTime(current)
                        .endTime(slotEnd)
                        .status(TimeSlotStatus.AVAILABLE)
                        .source(source)
                        .batchId(batchId)
                        .build());
            }
            current = slotEnd;
        }
        return slots;
    }

    private BulkCreatePreviewDTO doBulkCreatePreview(List<Long> doctorIds, LocalDate startDate, LocalDate endDate,
                                                     List<String> daysOfWeek, List<TimeSlotConfigDTO> timeSlotConfigs,
                                                     List<BreakTimeDTO> breakTimes, Integer slotDuration) {
        Set<LocalDate> holidayDates = new HashSet<>(getHolidayDatesInRange(startDate, endDate));
        Set<String> allowedDays = new HashSet<>(daysOfWeek.stream()
                .map(String::toUpperCase).collect(Collectors.toList()));

        // Batch-load ALL existing slots for all doctors in date range (1 query instead of N*M)
        List<TimeSlot> allExistingSlots = timeSlotRepository.findByDoctorIdsAndDateRange(doctorIds, startDate, endDate);
        // Index by doctorId -> date -> list of slots for fast in-memory lookup
        Map<Long, Map<LocalDate, List<TimeSlot>>> existingMap = new HashMap<>();
        for (TimeSlot ts : allExistingSlots) {
            existingMap
                    .computeIfAbsent(ts.getDoctor().getId(), k -> new HashMap<>())
                    .computeIfAbsent(ts.getSlotDate(), k -> new ArrayList<>())
                    .add(ts);
        }

        // Batch-load all doctors
        Map<Long, Doctor> doctorMap = new HashMap<>();
        for (Long doctorId : doctorIds) {
            try {
                doctorMap.put(doctorId, findDoctorOrThrow(doctorId));
            } catch (Exception e) {
                // skip invalid doctor
            }
        }

        int totalToCreate = 0;
        List<BulkCreatePreviewDTO.ConflictDetail> conflicts = new ArrayList<>();

        for (Long doctorId : doctorIds) {
            Doctor doctor = doctorMap.get(doctorId);
            if (doctor == null) continue;

            Map<LocalDate, List<TimeSlot>> doctorSlots = existingMap.getOrDefault(doctorId, Collections.emptyMap());

            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                if (holidayDates.contains(current) || current.isBefore(LocalDate.now())) {
                    current = current.plusDays(1);
                    continue;
                }
                String dayName = current.getDayOfWeek().name();
                if (!allowedDays.contains(dayName)) {
                    current = current.plusDays(1);
                    continue;
                }

                List<TimeSlot> daySlotsExisting = doctorSlots.getOrDefault(current, Collections.emptyList());

                for (TimeSlotConfigDTO config : timeSlotConfigs) {
                    LocalTime slotStart = config.getStartTime();
                    while (slotStart.plusMinutes(slotDuration).compareTo(config.getEndTime()) <= 0) {
                        LocalTime slotEnd = slotStart.plusMinutes(slotDuration);

                        boolean isBreak = false;
                        if (breakTimes != null) {
                            for (BreakTimeDTO bt : breakTimes) {
                                if (isOverlap(slotStart, slotEnd, bt.getStartTime(), bt.getEndTime())) {
                                    isBreak = true;
                                    break;
                                }
                            }
                        }

                        if (!isBreak) {
                            // In-memory overlap check instead of per-slot DB query
                            List<TimeSlot> overlapping = findOverlappingInMemory(daySlotsExisting, slotStart, slotEnd);
                            if (overlapping.isEmpty()) {
                                totalToCreate++;
                            } else {
                                for (TimeSlot ex : overlapping) {
                                    conflicts.add(BulkCreatePreviewDTO.ConflictDetail.builder()
                                            .doctorId(doctor.getId())
                                            .doctorName(doctor.getFullName())
                                            .date(current)
                                            .startTime(slotStart.toString())
                                            .endTime(slotEnd.toString())
                                            .existingStatus(ex.getStatus().name())
                                            .build());
                                }
                            }
                        }
                        slotStart = slotEnd;
                    }
                }
                current = current.plusDays(1);
            }
        }

        return BulkCreatePreviewDTO.builder()
                .totalSlotsToCreate(totalToCreate)
                .conflictCount(conflicts.size())
                .skippedHolidayCount(holidayDates.size())
                .conflicts(conflicts)
                .holidayDates(new ArrayList<>(holidayDates))
                .build();
    }

    /** In-memory overlap check: existing.start < newEnd AND existing.end > newStart */
    private List<TimeSlot> findOverlappingInMemory(List<TimeSlot> existingSlots, LocalTime newStart, LocalTime newEnd) {
        List<TimeSlot> result = new ArrayList<>();
        for (TimeSlot ts : existingSlots) {
            if (ts.getStartTime().isBefore(newEnd) && ts.getEndTime().isAfter(newStart)) {
                result.add(ts);
            }
        }
        return result;
    }

    private boolean isOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    // ---- DTO conversion ----

    private TimeSlotDTO toDTO(TimeSlot slot) {
        TimeSlotDTO dto = TimeSlotDTO.builder()
                .id(slot.getId())
                .doctorId(slot.getDoctor().getId())
                .doctorName(slot.getDoctor().getFullName())
                .specialization(slot.getDoctor().getSpecialization())
                .slotDate(slot.getSlotDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status(slot.getStatus().name())
                .isAvailable(slot.isAvailable())
                .source(slot.getSource() != null ? slot.getSource().name() : null)
                .batchId(slot.getBatchId())
                .note(slot.getNote())
                .blockReason(slot.getBlockReason() != null ? slot.getBlockReason().name() : null)
                .blockNote(slot.getBlockNote())
                .blockUntil(slot.getBlockUntil())
                .blockedBy(slot.getBlockedBy())
                .blockedAt(slot.getBlockedAt())
                .createdAt(slot.getCreatedAt())
                .updatedAt(slot.getUpdatedAt())
                .build();

        // Appointment info if booked
        if (slot.isBooked() || slot.isCompleted() || slot.isReserved()) {
            try {
                // Primary lookup: by time_slot_id FK
                Optional<Appointment> apptOpt = appointmentRepository.findByTimeSlotId(slot.getId());

                // Fallback for legacy data where time_slot_id was not set
                if (apptOpt.isEmpty()) {
                    apptOpt = appointmentRepository.findByDoctorAndDateTime(
                            slot.getDoctor().getId(), slot.getSlotDate(),
                            slot.getStartTime(), slot.getEndTime());
                }

                apptOpt.ifPresent(appt -> {
                    dto.setAppointmentCode(appt.getAppointmentCode());
                    dto.setAppointmentId(appt.getId());
                });
            } catch (Exception e) {
                log.debug("Could not fetch appointment for slot {}: {}", slot.getId(), e.getMessage());
            }
        }

        // Blocked-by user name
        if (slot.getBlockedBy() != null) {
            try {
                userRepository.findById(slot.getBlockedBy()).ifPresent(u -> dto.setBlockedByName(u.getFullName()));
            } catch (Exception e) {
                // ignore
            }
        }

        return dto;
    }

    private TimeSlotTemplateDTO toTemplateDTO(TimeSlotTemplate template) {
        return TimeSlotTemplateDTO.builder()
                .id(template.getId())
                .templateName(template.getTemplateName())
                .description(template.getDescription())
                .daysOfWeek(template.getDaysOfWeek())
                .timeSlots(convertToTimeSlotConfigs(template.getTimeSlots()))
                .breakTimes(convertToBreakTimeConfigs(template.getBreakTimes()))
                .slotDuration(template.getSlotDuration())
                .isActive(template.getIsActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private ClinicHolidayDTO toHolidayDTO(ClinicHoliday h) {
        return ClinicHolidayDTO.builder()
                .id(h.getId())
                .holidayDate(h.getHolidayDate())
                .name(h.getName())
                .description(h.getDescription())
                .autoBlockSlots(h.getAutoBlockSlots())
                .preventSlotCreation(h.getPreventSlotCreation())
                .isActive(h.getIsActive())
                .build();
    }

    private ClinicWorkingHoursDTO toWorkingHoursDTO(ClinicWorkingHours wh) {
        return ClinicWorkingHoursDTO.builder()
                .id(wh.getId())
                .dayOfWeek(wh.getDayOfWeek())
                .dayName(wh.getDayName())
                .openTime(wh.getOpenTime())
                .closeTime(wh.getCloseTime())
                .isOpen(wh.getIsOpen())
                .build();
    }

    // ---- Template JSON conversions ----

    private List<Map<String, String>> convertTimeSlots(List<TimeSlotConfigDTO> configs) {
        if (configs == null) return null;
        return configs.stream().map(c -> {
            Map<String, String> map = new HashMap<>();
            map.put("startTime", c.getStartTime().toString());
            map.put("endTime", c.getEndTime().toString());
            return map;
        }).collect(Collectors.toList());
    }

    private List<Map<String, String>> convertBreakTimes(List<BreakTimeDTO> breakTimes) {
        if (breakTimes == null) return null;
        return breakTimes.stream().map(b -> {
            Map<String, String> map = new HashMap<>();
            map.put("startTime", b.getStartTime().toString());
            map.put("endTime", b.getEndTime().toString());
            return map;
        }).collect(Collectors.toList());
    }

    private List<TimeSlotConfigDTO> convertToTimeSlotConfigs(List<Map<String, String>> maps) {
        if (maps == null) return Collections.emptyList();
        return maps.stream().map(m -> TimeSlotConfigDTO.builder()
                .startTime(LocalTime.parse(m.get("startTime")))
                .endTime(LocalTime.parse(m.get("endTime")))
                .build()).collect(Collectors.toList());
    }

    private List<BreakTimeDTO> convertToBreakTimeConfigs(List<Map<String, String>> maps) {
        if (maps == null) return Collections.emptyList();
        return maps.stream().map(m -> BreakTimeDTO.builder()
                .startTime(LocalTime.parse(m.get("startTime")))
                .endTime(LocalTime.parse(m.get("endTime")))
                .build()).collect(Collectors.toList());
    }

    // ---- Bulk result helpers ----

    private BulkActionResultDTO buildBulkResult(int total, int success, int fail,
                                                List<BulkActionResultDTO.ItemResult> results, String message) {
        return BulkActionResultDTO.builder()
                .totalProcessed(total)
                .successCount(success)
                .failCount(fail)
                .results(results)
                .message(message)
                .build();
    }

    private BulkActionResultDTO.ItemResult successItem(Long id, String message) {
        return BulkActionResultDTO.ItemResult.builder()
                .appointmentId(id)
                .success(true)
                .message(message)
                .build();
    }

    private BulkActionResultDTO.ItemResult failItem(Long id, String errorCode, String message) {
        return BulkActionResultDTO.ItemResult.builder()
                .appointmentId(id)
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
