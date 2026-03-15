package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;

import java.util.List;

/**
 * Service interface for Doctor Schedule management
 */
public interface DoctorScheduleService {

    // ========== SCHEDULE MANAGEMENT ==========
    
    /**
     * Create a new weekly schedule for the doctor
     * @param doctorId Doctor ID (from security context)
     * @param dto Schedule data
     * @return Created schedule
     */
    DoctorScheduleDTO createSchedule(Long doctorId, DoctorScheduleDTO dto);

    /**
     * List all schedules for the logged-in doctor
     * @param doctorId Doctor ID
     * @param dayOfWeek Optional filter by day of week (0-6)
     * @return List of schedules
     */
    List<DoctorScheduleDTO> listMySchedules(Long doctorId, Integer dayOfWeek);

    /**
     * Update an existing schedule
     * @param doctorId Doctor ID (for ownership validation)
     * @param scheduleId Schedule ID
     * @param dto Updated schedule data
     * @return Updated schedule
     */
    DoctorScheduleDTO updateSchedule(Long doctorId, Long scheduleId, DoctorScheduleDTO dto);

    /**
     * Delete a schedule
     * @param doctorId Doctor ID
     * @param scheduleId Schedule ID
     */
    void deleteSchedule(Long doctorId, Long scheduleId);

    // ========== SCHEDULE EXCEPTIONS ==========
    
    /**
     * Add a schedule exception (OFF/MODIFIED/EXTRA)
     * @param doctorId Doctor ID
     * @param dto Exception data
     * @return Created exception
     */
    ScheduleExceptionDTO addScheduleException(Long doctorId, ScheduleExceptionDTO dto);

    /**
     * List schedule exceptions for a doctor
     * @param doctorId Doctor ID
     * @return List of exceptions
     */
    List<ScheduleExceptionDTO> listMyExceptions(Long doctorId);

    /**
     * Delete a schedule exception
     * @param doctorId Doctor ID
     * @param exceptionId Exception ID
     */
    void deleteScheduleException(Long doctorId, Long exceptionId);

    // ========== TIME SLOTS ==========

    /**
     * List time slots for a doctor in date range
     * @param doctorId Doctor ID
     * @param startDate Start date (YYYY-MM-DD)
     * @param endDate End date (YYYY-MM-DD)
     * @return List of time slots
     */
    List<TimeSlotDTO> listTimeSlots(Long doctorId, String startDate, String endDate);

    /**
     * Create a new time slot
     * @param doctorId Doctor ID
     * @param dto Time slot data
     * @return Created time slot
     */
    TimeSlotDTO createTimeSlot(Long doctorId, TimeSlotDTO dto);

    /**
     * Update an existing time slot
     * @param doctorId Doctor ID
     * @param slotId Slot ID
     * @param dto Updated slot data
     * @return Updated time slot
     */
    TimeSlotDTO updateTimeSlot(Long doctorId, Long slotId, TimeSlotDTO dto);

    /**
     * Delete a time slot
     * @param doctorId Doctor ID
     * @param slotId Slot ID
     */
    void deleteTimeSlot(Long doctorId, Long slotId);
    
    /**
     * Generate time slots based on schedule and exceptions
     * @param doctorId Doctor ID
     * @param dto Generation parameters
     * @return Summary message
     */
    MessageDTO generateTimeSlots(Long doctorId, GenerateSlotsDTO dto);

    /**
     * Block a specific time slot
     * @param doctorId Doctor ID
     * @param slotId Slot ID
     * @param dto Block reason (optional)
     * @return Updated slot
     */
    TimeSlotDTO blockSlot(Long doctorId, Long slotId, BlockSlotDTO dto);

    /**
     * Unblock a specific time slot
     * @param doctorId Doctor ID
     * @param slotId Slot ID
     * @return Updated slot
     */
    TimeSlotDTO unblockSlot(Long doctorId, Long slotId);

    /**
     * List time slots for a doctor in date range
     * @param doctorId Doctor ID
     * @param dto Date range parameters
     * @return List of time slots
     */
    List<TimeSlotDTO> listMyTimeSlots(Long doctorId, GenerateSlotsDTO dto);
}
