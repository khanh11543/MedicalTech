import api from "./api";

// =========== ENUMS ===========
export enum TimeSlotStatus {
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
  BLOCKED = "BLOCKED",
  COMPLETED = "COMPLETED",
  RESERVED = "RESERVED",
}

export enum SlotSource {
  MANUAL = "MANUAL",
  BULK = "BULK",
  TEMPLATE = "TEMPLATE",
}

export enum BlockReason {
  VACATION = "VACATION",
  MEETING = "MEETING",
  EMERGENCY = "EMERGENCY",
  TRAINING = "TRAINING",
  PERSONAL = "PERSONAL",
  OTHER = "OTHER",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

// =========== DTOs ===========
export interface TimeSlotDTO {
  id: number;
  doctorId: number;
  doctorName: string;
  specialization: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isAvailable: boolean;
  source: string;
  batchId?: string;
  note?: string;
  blockReason?: string;
  blockNote?: string;
  blockUntil?: string;
  blockedBy?: number;
  blockedByName?: string;
  blockedAt?: string;
  appointmentCode?: string;
  appointmentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlotFilterDTO {
  doctorId?: number;
  date?: string;
  from?: string;
  to?: string;
  status?: string;
  source?: string;
  timeOfDay?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateSingleSlotDTO {
  doctorId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateSlotDTO {
  startTime: string;
  endTime: string;
  note?: string;
  confirmHighRisk?: boolean;
}

export interface BlockSlotRequestDTO {
  reason: string;
  note?: string;
  blockUntil?: string;
  notifyDoctor?: boolean;
}

// =========== BULK CREATE ===========
export interface TimeSlotConfigDTO {
  startTime: string;
  endTime: string;
}

export interface BreakTimeDTO {
  startTime: string;
  endTime: string;
}

export interface BulkCreateSlotsDTO {
  doctorIds: number[];
  startDate: string;
  endDate: string;
  daysOfWeek: string[];
  timeSlots: TimeSlotConfigDTO[];
  breakTimes?: BreakTimeDTO[];
  slotDuration?: number;
  conflictMode?: string;
  previewOnly?: boolean;
}

export interface BulkCreatePreviewDTO {
  totalSlotsToCreate: number;
  conflictCount: number;
  skippedHolidayCount: number;
  conflicts: ConflictDetail[];
  holidayDates: string[];
}

export interface ConflictDetail {
  doctorId: number;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  existingStatus: string;
}

// =========== BULK BLOCK/UNBLOCK ===========
export interface BulkBlockSlotsDTO {
  timeSlotIds: number[];
  reason: string;
  note?: string;
  blockUntil?: string;
  notifyDoctor?: boolean;
}

export interface BulkUnblockSlotsDTO {
  timeSlotIds: number[];
  reason?: string;
}

// =========== BULK ACTION RESULT ===========
export interface BulkActionResultDTO {
  totalProcessed: number;
  successCount: number;
  failCount: number;
  results: ItemResult[];
  message: string;
}

export interface ItemResult {
  appointmentId?: number;
  appointmentCode?: string;
  success: boolean;
  message?: string;
  errorCode?: string;
}

// =========== CALENDAR ===========
export interface CalendarDayDTO {
  date: string;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  completedSlots: number;
  reservedSlots: number;
  doctorSummaries?: Record<number, DoctorDaySummary>;
}

export interface DoctorDaySummary {
  doctorId: number;
  doctorName: string;
  total: number;
  available: number;
  booked: number;
  blocked: number;
}

// =========== STATISTICS ===========
export interface SlotStatisticsDTO {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  completedSlots: number;
  reservedSlots: number;
  utilizationRate: number;
  lowestAvailabilityDoctor?: string;
  lowestAvailabilityDoctorId?: number;
  lowestAvailabilityCount?: number;
}

// =========== TEMPLATES ===========
export interface TimeSlotTemplateDTO {
  id: number;
  templateName: string;
  description?: string;
  daysOfWeek: string[];
  timeSlots: TimeSlotConfigDTO[];
  breakTimes: BreakTimeDTO[];
  slotDuration: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemplateDTO {
  templateName: string;
  description?: string;
  daysOfWeek: string[];
  timeSlots: TimeSlotConfigDTO[];
  breakTimes?: BreakTimeDTO[];
  slotDuration?: number;
  isActive?: boolean;
}

export interface UpdateTemplateDTO {
  templateName: string;
  description?: string;
  daysOfWeek: string[];
  timeSlots: TimeSlotConfigDTO[];
  breakTimes?: BreakTimeDTO[];
  slotDuration?: number;
  isActive?: boolean;
}

export interface ApplyTemplateDTO {
  doctorIds: number[];
  startDate: string;
  endDate: string;
  overwriteExisting?: boolean;
  conflictMode?: string;
  previewOnly?: boolean;
}

// =========== HOLIDAYS ===========
export interface ClinicHolidayDTO {
  id?: number;
  holidayDate: string;
  name: string;
  description?: string;
  autoBlockSlots?: boolean;
  preventSlotCreation?: boolean;
  isActive?: boolean;
}

// =========== WORKING HOURS ===========
export interface ClinicWorkingHoursDTO {
  id?: number;
  dayOfWeek: number;
  dayName?: string;
  openTime: string;
  closeTime: string;
  isOpen?: boolean;
}

// =========== DOCTOR BASIC ===========
export interface DoctorBasicDTO {
  id: number;
  fullName: string;
  email?: string;
  avatar?: string;
  specialization?: string;
}

// =========== PAGE RESPONSE ===========
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface MessageDTO {
  message: string;
}

// =========== SERVICE ===========
const timeSlotService = {
  // =================== SLOT CRUD ===================
  getAllTimeSlots: async (filter: TimeSlotFilterDTO): Promise<PageResponse<TimeSlotDTO>> => {
    const params: Record<string, string> = {};
    if (filter.doctorId) params.doctorId = filter.doctorId.toString();
    if (filter.date) params.date = filter.date;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    if (filter.status) params.status = filter.status;
    if (filter.source) params.source = filter.source;
    if (filter.timeOfDay) params.timeOfDay = filter.timeOfDay;
    if (filter.pageNumber !== undefined) params.pageNumber = filter.pageNumber.toString();
    if (filter.pageSize !== undefined) params.pageSize = filter.pageSize.toString();
    const response = await api.get("/admin/time-slots", { params });
    return response.data;
  },

  getTimeSlotById: async (id: number): Promise<TimeSlotDTO> => {
    const response = await api.get(`/admin/time-slots/${id}`);
    return response.data;
  },

  createTimeSlot: async (data: CreateSingleSlotDTO): Promise<TimeSlotDTO> => {
    const response = await api.post("/admin/time-slots", data);
    return response.data;
  },

  updateTimeSlot: async (id: number, data: UpdateSlotDTO): Promise<TimeSlotDTO> => {
    const response = await api.put(`/admin/time-slots/${id}`, data);
    return response.data;
  },

  deleteTimeSlot: async (id: number): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/time-slots/${id}`);
    return response.data;
  },

  // =================== BLOCK / UNBLOCK ===================
  blockTimeSlot: async (id: number, data: BlockSlotRequestDTO): Promise<TimeSlotDTO> => {
    const response = await api.post(`/admin/time-slots/${id}/block`, data);
    return response.data;
  },

  unblockTimeSlot: async (id: number): Promise<TimeSlotDTO> => {
    const response = await api.post(`/admin/time-slots/${id}/unblock`);
    return response.data;
  },

  bulkBlockSlots: async (data: BulkBlockSlotsDTO): Promise<BulkActionResultDTO> => {
    const response = await api.post("/admin/time-slots/bulk-block", data);
    return response.data;
  },

  bulkUnblockSlots: async (data: BulkUnblockSlotsDTO): Promise<BulkActionResultDTO> => {
    const response = await api.post("/admin/time-slots/bulk-unblock", data);
    return response.data;
  },

  // =================== BULK CREATE ===================
  previewBulkCreate: async (data: BulkCreateSlotsDTO): Promise<BulkCreatePreviewDTO> => {
    const response = await api.post("/admin/time-slots/bulk-create/preview", data, {
      timeout: 60000, // 60s timeout for large previews
    });
    return response.data;
  },

  bulkCreateSlots: async (data: BulkCreateSlotsDTO): Promise<BulkActionResultDTO> => {
    const response = await api.post("/admin/time-slots/bulk-create", data, {
      timeout: 120000, // 120s timeout for large bulk creates
    });
    return response.data;
  },

  rollbackBatch: async (batchId: string): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/time-slots/bulk-create/rollback/${batchId}`);
    return response.data;
  },

  // =================== TEMPLATES ===================
  getAllTemplates: async (activeOnly = false): Promise<TimeSlotTemplateDTO[]> => {
    const response = await api.get("/admin/time-slots/templates", { params: { activeOnly } });
    return response.data;
  },

  getTemplateById: async (id: number): Promise<TimeSlotTemplateDTO> => {
    const response = await api.get(`/admin/time-slots/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: CreateTemplateDTO): Promise<TimeSlotTemplateDTO> => {
    const response = await api.post("/admin/time-slots/templates", data);
    return response.data;
  },

  updateTemplate: async (id: number, data: UpdateTemplateDTO): Promise<TimeSlotTemplateDTO> => {
    const response = await api.put(`/admin/time-slots/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/time-slots/templates/${id}`);
    return response.data;
  },

  previewApplyTemplate: async (id: number, data: ApplyTemplateDTO): Promise<BulkCreatePreviewDTO> => {
    const response = await api.post(`/admin/time-slots/templates/${id}/apply/preview`, data);
    return response.data;
  },

  applyTemplate: async (id: number, data: ApplyTemplateDTO): Promise<BulkActionResultDTO> => {
    const response = await api.post(`/admin/time-slots/templates/${id}/apply`, data);
    return response.data;
  },

  // =================== CALENDAR ===================
  getCalendarData: async (from: string, to: string, doctorId?: number): Promise<CalendarDayDTO[]> => {
    const params: Record<string, string> = { from, to };
    if (doctorId) params.doctorId = doctorId.toString();
    const response = await api.get("/admin/time-slots/calendar", { params });
    return response.data;
  },

  // =================== STATISTICS ===================
  getStatistics: async (date?: string, doctorId?: number): Promise<SlotStatisticsDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (doctorId) params.doctorId = doctorId.toString();
    const response = await api.get("/admin/time-slots/statistics", { params });
    return response.data;
  },

  // =================== HOLIDAYS ===================
  getAllHolidays: async (year?: number): Promise<ClinicHolidayDTO[]> => {
    const params: Record<string, string> = {};
    if (year) params.year = year.toString();
    const response = await api.get("/admin/time-slots/holidays", { params });
    return response.data;
  },

  createHoliday: async (data: ClinicHolidayDTO): Promise<ClinicHolidayDTO> => {
    const response = await api.post("/admin/time-slots/holidays", data);
    return response.data;
  },

  updateHoliday: async (id: number, data: ClinicHolidayDTO): Promise<ClinicHolidayDTO> => {
    const response = await api.put(`/admin/time-slots/holidays/${id}`, data);
    return response.data;
  },

  deleteHoliday: async (id: number): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/time-slots/holidays/${id}`);
    return response.data;
  },

  // =================== WORKING HOURS ===================
  getAllWorkingHours: async (): Promise<ClinicWorkingHoursDTO[]> => {
    const response = await api.get("/admin/time-slots/working-hours");
    return response.data;
  },

  upsertWorkingHours: async (data: ClinicWorkingHoursDTO): Promise<ClinicWorkingHoursDTO> => {
    const response = await api.post("/admin/time-slots/working-hours", data);
    return response.data;
  },

  deleteWorkingHours: async (id: number): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/time-slots/working-hours/${id}`);
    return response.data;
  },

  // =================== DOCTORS LIST ===================
  getDoctorsList: async (): Promise<DoctorBasicDTO[]> => {
    const response = await api.get("/admin/doctors/list");
    return response.data;
  },
};

export default timeSlotService;
