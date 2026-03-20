import api from './api';

// =========== ENUMS & TYPES ===========
export type ExceptionType = 'OFF' | 'MODIFIED' | 'EXTRA';
export type TimeSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'COMPLETED';

// =========== INTERFACES ===========

// Conflicting Appointment in Block Response
export interface ConflictingAppointmentDTO {
  appointmentId: number;
  patientName: string;
  patientPhone: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  appointmentType: string;
  reason: string;
  status: string;
}

// Block Slot Response (can contain success or conflicts)
export interface BlockSlotResponseDTO {
  success: boolean;
  blockedSlot?: TimeSlotDTO;
  hasConflicts: boolean;
  conflictingAppointments?: ConflictingAppointmentDTO[];
  message: string;
}

// Doctor Schedule DTO (weekly recurring schedule)
export interface DoctorScheduleDTO {
  id?: number;
  doctorId?: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  slotDuration: number; // in minutes (default 30)
  maxPatients: number; // default 20
  isActive: boolean; // default true
}

// Schedule Exception DTO (for specific dates)
export interface ScheduleExceptionDTO {
  id?: number;
  doctorId?: number;
  exceptionDate: string; // YYYY-MM-DD format
  exceptionType: ExceptionType;
  startTime?: string; // HH:mm, required for MODIFIED and EXTRA
  endTime?: string; // HH:mm, required for MODIFIED and EXTRA
  reason?: string; // Optional reason/notes
}

// Time Slot DTO (slot available for patient booking)
export interface TimeSlotDTO {
  id?: number;
  doctorId?: number;
  slotDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: TimeSlotStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Generate Slots DTO
export interface GenerateSlotsDTO {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  slotDuration?: number; // optional override duration
  overwriteExisting?: boolean; // default false
}

// Block/Unblock DTO
export interface BlockSlotDTO {
  reason: string; // REQUIRED reason for blocking
}

// Response types
export interface MessageDTO {
  message: string;
  success: boolean;
  data?: any;
}

// =========== HELPER FUNCTIONS ===========

/**
 * Get day name from day of week number
 */
export const getDayName = (dayOfWeek: number): string => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayOfWeek] || 'Unknown';
};

/**
 * Get day short name from day of week number
 */
export const getDayShortName = (dayOfWeek: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || 'Unknown';
};

// =========== SERVICE FUNCTIONS ===========
const doctorScheduleService = {
  /**
   * Check if schedules exist for the entire week (all 7 days)
   * Returns true if at least one schedule exists for any day of the week
   */
  hasWeeklySchedules: async (): Promise<boolean> => {
    try {
      const schedules = await doctorScheduleService.getDoctorSchedules();
      return schedules.length > 0;
    } catch (err) {
      console.error('Error checking for weekly schedules:', err);
      return false;
    }
  },

  /**
   * Get doctor schedules with optional filter
   */
  getDoctorSchedules: async (
    dayOfWeek?: number
  ): Promise<DoctorScheduleDTO[]> => {
    const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
    const response = await api.get<DoctorScheduleDTO[]>('/doctor/schedules', {
      params,
    });
    return response.data;
  },

  /**
   * Create a new doctor schedule
   */
  createDoctorSchedule: async (
    dto: Omit<DoctorScheduleDTO, 'id' | 'doctorId'>
  ): Promise<DoctorScheduleDTO> => {
    const response = await api.post<DoctorScheduleDTO>(
      '/doctor/schedules',
      dto
    );
    return response.data;
  },

  /**
   * Update an existing doctor schedule
   */
  updateDoctorSchedule: async (
    scheduleId: number,
    dto: Partial<Omit<DoctorScheduleDTO, 'id' | 'doctorId'>>
  ): Promise<DoctorScheduleDTO> => {
    const response = await api.put<DoctorScheduleDTO>(
      `/doctor/schedules/${scheduleId}`,
      dto
    );
    return response.data;
  },

  /**
   * Delete a doctor schedule
   */
  deleteDoctorSchedule: async (scheduleId: number): Promise<void> => {
    await api.delete(`/doctor/schedules/${scheduleId}`);
  },

  // ========== SCHEDULE EXCEPTIONS ==========

  /**
   * Add a schedule exception (OFF/MODIFIED/EXTRA)
   */
  addScheduleException: async (
    dto: Omit<ScheduleExceptionDTO, 'id' | 'doctorId'>
  ): Promise<ScheduleExceptionDTO> => {
    const response = await api.post<ScheduleExceptionDTO>(
      '/doctor/schedule-exceptions',
      dto
    );
    return response.data;
  },

  /**
   * List all schedule exceptions
   */
  listScheduleExceptions: async (): Promise<ScheduleExceptionDTO[]> => {
    const response = await api.get<ScheduleExceptionDTO[]>(
      '/doctor/schedule-exceptions'
    );
    return response.data;
  },

  /**
   * Delete a schedule exception
   */
  deleteScheduleException: async (exceptionId: number): Promise<void> => {
    await api.delete(`/doctor/schedule-exceptions/${exceptionId}`);
  },

  // ========== TIME SLOTS ==========

  /**
   * List time slots for a date range
   */
  listTimeSlots: async (
    startDate: string,
    endDate: string
  ): Promise<TimeSlotDTO[]> => {
    const response = await api.get<TimeSlotDTO[]>('/doctor/time-slots', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Create a single time slot
   */
  createTimeSlot: async (
    dto: Omit<TimeSlotDTO, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'>
  ): Promise<TimeSlotDTO> => {
    const response = await api.post<TimeSlotDTO>('/doctor/time-slots', dto);
    return response.data;
  },

  /**
   * Update a time slot
   */
  updateTimeSlot: async (
    slotId: number,
    dto: Partial<
      Omit<TimeSlotDTO, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<TimeSlotDTO> => {
    const response = await api.put<TimeSlotDTO>(
      `/doctor/time-slots/${slotId}`,
      dto
    );
    return response.data;
  },

  /**
   * Delete a time slot
   */
  deleteTimeSlot: async (slotId: number): Promise<void> => {
    await api.delete(`/doctor/time-slots/${slotId}`);
  },

  /**
   * Generate time slots based on schedules and exceptions
   */
  generateTimeSlots: async (dto: GenerateSlotsDTO): Promise<MessageDTO> => {
    const response = await api.post<MessageDTO>(
      '/doctor/time-slots/generate',
      dto
    );
    return response.data;
  },

  /**
   * Block a time slot with conflict detection
   * Returns either successful block or conflicts that need to be rescheduled
   */
  blockTimeSlot: async (
    slotId: number,
    reason: string
  ): Promise<BlockSlotResponseDTO> => {
    const response = await api.patch<BlockSlotResponseDTO>(
      `/doctor/time-slots/${slotId}/block`,
      {
        reason: reason,
      }
    );
    return response.data;
  },

  /**
   * Unblock a time slot
   */
  unblockTimeSlot: async (slotId: number): Promise<TimeSlotDTO> => {
    const response = await api.patch<TimeSlotDTO>(
      `/doctor/time-slots/${slotId}/unblock`
    );
    return response.data;
  },
};

export default doctorScheduleService;
