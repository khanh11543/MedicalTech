package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DoctorScheduleMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.SlotSource;
import com.q2k.meditech.entity.enums.TimeSlotStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of Doctor Schedule Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository scheduleRepository;
    private final ScheduleExceptionRepository exceptionRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final DoctorScheduleMapper mapper;

    // ========== SCHEDULE MANAGEMENT ==========

    @Override
    @Transactional
    public DoctorScheduleDTO createSchedule(Long doctorId, DoctorScheduleDTO dto) {
        log.info("Creating schedule for doctor ID: {}, dayOfWeek: {}", doctorId, dto.getDayOfWeek());

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        // Validate time range
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        // Check for conflicting schedules
        if (scheduleRepository.existsConflictingScheduleNew(
                doctorId, dto.getDayOfWeek(), dto.getStartTime(), dto.getEndTime())) {
            throw new BadRequestException("Schedule conflicts with existing schedule on " + dto.getDayName());
        }

        // Create entity
        DoctorSchedule schedule = mapper.toEntity(dto);
        schedule.setDoctor(doctor);

        // Set defaults if not provided
        if (schedule.getSlotDuration() == null) {
            schedule.setSlotDuration(30);
        }
        if (schedule.getMaxPatients() == null) {
            schedule.setMaxPatients(20);
        }
        if (schedule.getIsActive() == null) {
            schedule.setIsActive(true);
        }

        schedule = scheduleRepository.save(schedule);
        log.info("Schedule created successfully with ID: {}", schedule.getId());

        return mapper.toDTO(schedule);
    }

    @Override
    public List<DoctorScheduleDTO> listMySchedules(Long doctorId, Integer dayOfWeek) {
        log.info("Listing schedules for doctor ID: {}, dayOfWeek: {}", doctorId, dayOfWeek);

        List<DoctorSchedule> schedules;
        if (dayOfWeek != null) {
            schedules = scheduleRepository.findByDoctorIdAndDayOfWeekOrderByStartTimeAsc(doctorId, dayOfWeek);
        } else {
            schedules = scheduleRepository.findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(doctorId);
        }

        return mapper.toDTOList(schedules);
    }

    @Override
    @Transactional
    public DoctorScheduleDTO updateSchedule(Long doctorId, Long scheduleId, DoctorScheduleDTO dto) {
        log.info("Updating schedule ID: {} for doctor ID: {}", scheduleId, doctorId);

        // Find and validate ownership
        DoctorSchedule schedule = scheduleRepository.findByIdWithDoctor(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + scheduleId));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only update your own schedules");
        }

        // Validate time range if provided
        LocalTime startTime = dto.getStartTime() != null ? dto.getStartTime() : schedule.getStartTime();
        LocalTime endTime = dto.getEndTime() != null ? dto.getEndTime() : schedule.getEndTime();
        validateTimeRange(startTime, endTime);

        // Check for conflicts (excluding current schedule)
        Integer dayOfWeek = dto.getDayOfWeek() != null ? dto.getDayOfWeek() : schedule.getDayOfWeek();
        if (scheduleRepository.existsConflictingSchedule(doctorId, dayOfWeek, startTime, endTime, scheduleId)) {
            throw new BadRequestException("Schedule conflicts with existing schedule");
        }

        // Update fields
        mapper.updateEntityFromDTO(dto, schedule);

        schedule = scheduleRepository.save(schedule);
        log.info("Schedule updated successfully: {}", scheduleId);

        return mapper.toDTO(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long doctorId, Long scheduleId) {
        log.info("Deleting schedule ID: {} for doctor ID: {}", scheduleId, doctorId);

        DoctorSchedule schedule = scheduleRepository.findByIdWithDoctor(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", "id", scheduleId));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only delete your own schedules");
        }

        scheduleRepository.delete(schedule);
        log.info("Schedule deleted successfully: {}", scheduleId);
    }

    // ========== SCHEDULE EXCEPTIONS ==========

    @Override
    @Transactional
    public ScheduleExceptionDTO addScheduleException(Long doctorId, ScheduleExceptionDTO dto) {
        log.info("Adding schedule exception for doctor ID: {}, date: {}, type: {}",
                doctorId, dto.getExceptionDate(), dto.getExceptionType());

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        // Check if exception already exists for this date
        if (exceptionRepository.existsByDoctorIdAndExceptionDate(doctorId, dto.getExceptionDate())) {
            throw new BadRequestException("Exception already exists for date: " + dto.getExceptionDate());
        }

        // Validate MODIFIED/EXTRA types require time range
        if (("MODIFIED".equals(dto.getExceptionType()) || "EXTRA".equals(dto.getExceptionType()))
                && (dto.getStartTime() == null || dto.getEndTime() == null)) {
            throw new BadRequestException("Start time and end time are required for " + dto.getExceptionType() + " type");
        }

        // Validate time range if provided
        if (dto.getStartTime() != null && dto.getEndTime() != null) {
            validateTimeRange(dto.getStartTime(), dto.getEndTime());
        }

        ScheduleException exception = mapper.toExceptionEntity(dto);
        exception.setDoctor(doctor);

        exception = exceptionRepository.save(exception);
        log.info("Schedule exception created with ID: {}", exception.getId());

        return mapper.toExceptionDTO(exception);
    }

    @Override
    public List<ScheduleExceptionDTO> listMyExceptions(Long doctorId) {
        log.info("Listing exceptions for doctor ID: {}", doctorId);
        List<ScheduleException> exceptions = exceptionRepository.findByDoctorIdOrderByExceptionDateAsc(doctorId);
        return mapper.toExceptionDTOList(exceptions);
    }

    @Override
    @Transactional
    public void deleteScheduleException(Long doctorId, Long exceptionId) {
        log.info("Deleting exception ID: {} for doctor ID: {}", exceptionId, doctorId);

        ScheduleException exception = exceptionRepository.findByIdWithDoctor(exceptionId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleException not found with id: " + exceptionId));

        if (!exception.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only delete your own exceptions");
        }

        exceptionRepository.delete(exception);
        log.info("Exception deleted successfully: {}", exceptionId);
    }

    // ========== TIME SLOTS ==========

    @Override
    @Transactional
    public MessageDTO generateTimeSlots(Long doctorId, GenerateSlotsDTO dto) {
        log.info("Generating time slots for doctor ID: {} from {} to {}",
                doctorId, dto.getStartDate(), dto.getEndDate());

        // Validate date range
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }

        // Limit generation to 30 days
        if (dto.getStartDate().plusDays(30).isBefore(dto.getEndDate())) {
            throw new BadRequestException("Cannot generate slots for more than 30 days at once");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        // Get schedules for the doctor
        List<DoctorSchedule> schedules = scheduleRepository
                .findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(doctorId);

        if (schedules.isEmpty()) {
            throw new BadRequestException("No active schedules found. Please create schedules first.");
        }

        // Group schedules by day of week
        Map<Integer, List<DoctorSchedule>> schedulesByDay = schedules.stream()
                .collect(Collectors.groupingBy(DoctorSchedule::getDayOfWeek));

        // Get exceptions in date range
        List<ScheduleException> exceptions = exceptionRepository
                .findByDoctorIdAndDateRange(doctorId, dto.getStartDate(), dto.getEndDate());
        
        Map<LocalDate, ScheduleException> exceptionsByDate = exceptions.stream()
                .collect(Collectors.toMap(ScheduleException::getExceptionDate, e -> e));

        // If overwrite, delete existing AVAILABLE slots
        if (Boolean.TRUE.equals(dto.getOverwriteExisting())) {
            int deleted = timeSlotRepository.deleteAvailableSlotsByDoctorIdAndDateRange(
                    doctorId, dto.getStartDate(), dto.getEndDate());
            log.info("Deleted {} existing available slots", deleted);
        }

        // Generate slots for each day in range
        List<TimeSlot> newSlots = new ArrayList<>();
        LocalDate currentDate = dto.getStartDate();

        while (!currentDate.isAfter(dto.getEndDate())) {
            int dayOfWeek = currentDate.getDayOfWeek().getValue() % 7; // Convert to 0=Sunday format
            
            ScheduleException exception = exceptionsByDate.get(currentDate);
            
            // Handle exceptions
            if (exception != null) {
                if ("OFF".equals(exception.getExceptionType())) {
                    // Skip this day - doctor is off
                    log.debug("Skipping {} - doctor is OFF", currentDate);
                } else if ("MODIFIED".equals(exception.getExceptionType())) {
                    // Use exception times instead of regular schedule
                    Integer slotDuration = dto.getSlotDuration() != null ? dto.getSlotDuration() : 30;
                    newSlots.addAll(generateSlotsForTimeRange(
                            doctor, currentDate, exception.getStartTime(), exception.getEndTime(), slotDuration));
                } else if ("EXTRA".equals(exception.getExceptionType())) {
                    // Add regular schedule slots plus extra
                    List<DoctorSchedule> daySchedules = schedulesByDay.get(dayOfWeek);
                    if (daySchedules != null) {
                        for (DoctorSchedule schedule : daySchedules) {
                            Integer slotDuration = dto.getSlotDuration() != null ? dto.getSlotDuration() : schedule.getSlotDuration();
                            newSlots.addAll(generateSlotsForTimeRange(
                                    doctor, currentDate, schedule.getStartTime(), schedule.getEndTime(), slotDuration));
                        }
                    }
                    // Add extra slots
                    Integer slotDuration = dto.getSlotDuration() != null ? dto.getSlotDuration() : 30;
                    newSlots.addAll(generateSlotsForTimeRange(
                            doctor, currentDate, exception.getStartTime(), exception.getEndTime(), slotDuration));
                }
            } else {
                // No exception - use regular schedule
                List<DoctorSchedule> daySchedules = schedulesByDay.get(dayOfWeek);
                if (daySchedules != null) {
                    for (DoctorSchedule schedule : daySchedules) {
                        Integer slotDuration = dto.getSlotDuration() != null ? dto.getSlotDuration() : schedule.getSlotDuration();
                        newSlots.addAll(generateSlotsForTimeRange(
                                doctor, currentDate, schedule.getStartTime(), schedule.getEndTime(), slotDuration));
                    }
                }
            }

            currentDate = currentDate.plusDays(1);
        }

        // Filter out duplicates (slots that already exist)
        List<TimeSlot> slotsToSave = new ArrayList<>();
        for (TimeSlot slot : newSlots) {
            if (!timeSlotRepository.existsByDoctorIdAndSlotDateAndStartTime(
                    doctorId, slot.getSlotDate(), slot.getStartTime())) {
                slotsToSave.add(slot);
            }
        }

        // Save all new slots
        if (!slotsToSave.isEmpty()) {
            timeSlotRepository.saveAll(slotsToSave);
        }

        String message = String.format("Generated %d time slots from %s to %s",
                slotsToSave.size(), dto.getStartDate(), dto.getEndDate());
        log.info(message);

        return MessageDTO.success(message);
    }

    @Override
    @Transactional
    public TimeSlotDTO blockSlot(Long doctorId, Long slotId, BlockSlotDTO dto) {
        log.info("Blocking slot ID: {} for doctor ID: {}", slotId, doctorId);

        TimeSlot slot = timeSlotRepository.findByIdWithDoctor(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", "id", slotId));

        // Validate ownership
        if (!slot.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only block your own time slots");
        }

        // Can only block AVAILABLE slots
        if (slot.getStatus() != TimeSlotStatus.AVAILABLE) {
            throw new BadRequestException("Can only block AVAILABLE slots. Current status: " + slot.getStatus());
        }

        slot.setStatus(TimeSlotStatus.BLOCKED);
        slot = timeSlotRepository.save(slot);

        log.info("Slot blocked successfully: {}", slotId);
        return mapper.toTimeSlotDTO(slot);
    }

    @Override
    @Transactional
    public TimeSlotDTO unblockSlot(Long doctorId, Long slotId) {
        log.info("Unblocking slot ID: {} for doctor ID: {}", slotId, doctorId);

        TimeSlot slot = timeSlotRepository.findByIdWithDoctor(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlot", "id", slotId));

        // Validate ownership
        if (!slot.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only unblock your own time slots");
        }

        // Can only unblock BLOCKED slots
        if (slot.getStatus() != TimeSlotStatus.BLOCKED) {
            throw new BadRequestException("Can only unblock BLOCKED slots. Current status: " + slot.getStatus());
        }

        slot.setStatus(TimeSlotStatus.AVAILABLE);
        slot = timeSlotRepository.save(slot);

        log.info("Slot unblocked successfully: {}", slotId);
        return mapper.toTimeSlotDTO(slot);
    }

    @Override
    public List<TimeSlotDTO> listTimeSlots(Long doctorId, String startDate, String endDate) {
        log.info("Listing time slots for doctor ID: {} from {} to {}",
                doctorId, startDate, endDate);

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<TimeSlot> slots = timeSlotRepository.findByDoctorIdAndDateRange(doctorId, start, end);

        return mapper.toTimeSlotDTOList(slots);
    }

    @Override
    @Transactional
    public TimeSlotDTO createTimeSlot(Long doctorId, TimeSlotDTO dto) {
        log.info("Creating time slot for doctor ID: {}, date: {}, time: {}-{}",
                doctorId, dto.getSlotDate(), dto.getStartTime(), dto.getEndTime());

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        // Validate time range
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        // Check for overlap
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingSlots(
                doctorId, dto.getSlotDate(), dto.getStartTime(), dto.getEndTime(), null);

        if (!overlapping.isEmpty()) {
            throw new BadRequestException("Time slot overlaps with existing slots");
        }

        // Create entity
        TimeSlot slot = new TimeSlot();
        slot.setDoctor(doctor);
        slot.setSlotDate(dto.getSlotDate());
        slot.setStartTime(dto.getStartTime());
        slot.setEndTime(dto.getEndTime());
        slot.setStatus(TimeSlotStatus.AVAILABLE);
        slot.setSource(SlotSource.MANUAL);

        slot = timeSlotRepository.save(slot);
        log.info("Time slot created successfully with ID: {}", slot.getId());

        return mapper.toTimeSlotDTO(slot);
    }

    @Override
    @Transactional
    public TimeSlotDTO updateTimeSlot(Long doctorId, Long slotId, TimeSlotDTO dto) {
        log.info("Updating time slot ID: {} for doctor ID: {}", slotId, doctorId);

        TimeSlot slot = timeSlotRepository.findByIdWithDoctor(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Time slot not found with id: " + slotId));

        // Verify ownership
        if (!slot.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only update your own time slots");
        }

        // Can only update AVAILABLE or BLOCKED slots
        if (!slot.isEditable()) {
            throw new BadRequestException("Cannot update a " + slot.getStatus() + " time slot");
        }

        // Validate new time range
        validateTimeRange(dto.getStartTime(), dto.getEndTime());

        // Check for overlap (excluding current slot)
        List<TimeSlot> overlapping = timeSlotRepository.findOverlappingSlots(
                doctorId, slot.getSlotDate(), dto.getStartTime(), dto.getEndTime(), slotId);

        if (!overlapping.isEmpty()) {
            throw new BadRequestException("Updated times would overlap with existing slots");
        }

        // Update fields
        slot.setStartTime(dto.getStartTime());
        slot.setEndTime(dto.getEndTime());

        slot = timeSlotRepository.save(slot);
        log.info("Time slot updated successfully: {}", slotId);

        return mapper.toTimeSlotDTO(slot);
    }

    @Override
    @Transactional
    public void deleteTimeSlot(Long doctorId, Long slotId) {
        log.info("Deleting time slot ID: {} for doctor ID: {}", slotId, doctorId);

        TimeSlot slot = timeSlotRepository.findByIdWithDoctor(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Time slot not found with id: " + slotId));

        // Verify ownership
        if (!slot.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only delete your own time slots");
        }

        // Can only delete AVAILABLE slots
        if (!slot.isDeletable()) {
            throw new BadRequestException("Cannot delete a " + slot.getStatus() + " time slot");
        }

        timeSlotRepository.delete(slot);
        log.info("Time slot deleted successfully: {}", slotId);
    }

    @Override
    public List<TimeSlotDTO> listMyTimeSlots(Long doctorId, GenerateSlotsDTO dto) {
        log.info("Listing time slots for doctor ID: {} from {} to {}",
                doctorId, dto.getStartDate(), dto.getEndDate());

        List<TimeSlot> slots = timeSlotRepository.findByDoctorIdAndDateRange(
                doctorId, dto.getStartDate(), dto.getEndDate());

        return mapper.toTimeSlotDTOList(slots);
    }

    // ========== HELPER METHODS ==========

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }
    }

    private List<TimeSlot> generateSlotsForTimeRange(
            Doctor doctor, LocalDate date, LocalTime startTime, LocalTime endTime, int slotDuration) {
        
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime currentTime = startTime;

        while (currentTime.plusMinutes(slotDuration).isBefore(endTime) ||
               currentTime.plusMinutes(slotDuration).equals(endTime)) {
            
            TimeSlot slot = TimeSlot.builder()
                    .doctor(doctor)
                    .slotDate(date)
                    .startTime(currentTime)
                    .endTime(currentTime.plusMinutes(slotDuration))
                    .status(TimeSlotStatus.AVAILABLE)
                    .build();
            
            slots.add(slot);
            currentTime = currentTime.plusMinutes(slotDuration);
        }

        return slots;
    }
}
