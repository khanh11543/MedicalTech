import api from "./api";

// Doctor Schedule DTO interface (weekly recurring schedule)
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

// Schedule Exception Types
export type ExceptionType = "OFF" | "MODIFIED" | "EXTRA";

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

// Time Slot DTO (generated from schedules)
export interface TimeSlotDTO {
  id?: number;
  doctorId?: number;
  slotDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  createdAt?: string;
}

// Generate Slots DTO
export interface GenerateSlotsDTO {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  slotDuration?: number; // optional override duration
  overwriteExisting?: boolean; // default false
}

// Day name helper
export const getDayName = (dayOfWeek: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
};

// Get day short name
export const getDayShortName = (dayOfWeek: number): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayOfWeek] || "Unknown";
};

/**
 * Get doctor schedules
 * @param dayOfWeek - Optional filter by day of week (0-6)
 * @returns Promise with list of schedules
 */
export const getDoctorSchedules = async (
  dayOfWeek?: number
): Promise<DoctorScheduleDTO[]> => {
  const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
  const response = await api.get<DoctorScheduleDTO[]>("/doctor/schedules", { params });
  return response.data;
};

/**
 * Create a new doctor schedule
 * @param dto - Schedule data
 * @returns Promise with created schedule
 */
export const createDoctorSchedule = async (
  dto: Omit<DoctorScheduleDTO, "id" | "doctorId">
): Promise<DoctorScheduleDTO> => {
  const response = await api.post<DoctorScheduleDTO>("/doctor/schedules", dto);
  return response.data;
};

/**
 * Update an existing doctor schedule
 * @param scheduleId - Schedule ID
 * @param dto - Updated schedule data
 * @returns Promise with updated schedule
 */
export const updateDoctorSchedule = async (
  scheduleId: number,
  dto: Partial<Omit<DoctorScheduleDTO, "id" | "doctorId">>
): Promise<DoctorScheduleDTO> => {
  const response = await api.put<DoctorScheduleDTO>(
    `/doctor/schedules/${scheduleId}`,
    dto
  );
  return response.data;
};

/**
 * Delete a doctor schedule
 * @param scheduleId - Schedule ID
 * @returns Promise
 */
export const deleteDoctorSchedule = async (scheduleId: number): Promise<void> => {
  await api.delete(`/doctor/schedules/${scheduleId}`);
};

// ========== SCHEDULE EXCEPTIONS ==========

/**
 * Add a schedule exception (OFF/MODIFIED/EXTRA)
 * @param dto - Exception data
 * @returns Promise with created exception
 */
export const addScheduleException = async (
  dto: Omit<ScheduleExceptionDTO, "id" | "doctorId">
): Promise<ScheduleExceptionDTO> => {
  const response = await api.post<ScheduleExceptionDTO>("/doctor/schedule-exceptions", dto);
  return response.data;
};

/**
 * List schedule exceptions
 * @returns Promise with list of exceptions
 */
export const listScheduleExceptions = async (): Promise<ScheduleExceptionDTO[]> => {
  const response = await api.get<ScheduleExceptionDTO[]>("/doctor/schedule-exceptions");
  return response.data;
};

/**
 * Delete a schedule exception
 * @param exceptionId - Exception ID
 * @returns Promise
 */
export const deleteScheduleException = async (exceptionId: number): Promise<void> => {
  await api.delete(`/doctor/schedule-exceptions/${exceptionId}`);
};

// ========== TIME SLOTS ==========

/**
 * Generate time slots based on schedules and exceptions
 * @param dto - Generation parameters (startDate, endDate, optional slotDuration, overwriteExisting)
 * @returns Promise
 */
export const generateTimeSlots = async (dto: GenerateSlotsDTO): Promise<void> => {
  await api.post("/doctor/time-slots/generate", dto);
};

/**
 * List time slots for a date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Promise with list of time slots
 */
export const listTimeSlots = async (startDate: string, endDate: string): Promise<TimeSlotDTO[]> => {
  const response = await api.get<TimeSlotDTO[]>("/doctor/time-slots", {
    params: { startDate, endDate },
  });
  return response.data;
};

// ========== BLOCK/UNBLOCK SLOTS ==========

/**
 * Block a time slot
 * @param slotId - Time slot ID
 * @param reason - Optional reason for blocking
 * @returns Promise with updated time slot
 */
export const blockTimeSlot = async (slotId: number, reason?: string): Promise<TimeSlotDTO> => {
  const response = await api.patch<TimeSlotDTO>(`/doctor/time-slots/${slotId}/block`, { reason: reason || "" });
  return response.data;
};

/**
 * Unblock a time slot
 * @param slotId - Time slot ID
 * @returns Promise with updated time slot
 */
export const unblockTimeSlot = async (slotId: number): Promise<TimeSlotDTO> => {
  const response = await api.patch<TimeSlotDTO>(`/doctor/time-slots/${slotId}/unblock`);
  return response.data;
};
