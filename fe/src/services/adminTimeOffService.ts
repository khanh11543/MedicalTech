import api from './api';
import type {
  AffectedAppointmentDTO,
  TimeOffRequestDTO,
  TimeOffStatus,
  TimeOffType,
} from './doctorScheduleService';

// Re-export for convenience
export type { AffectedAppointmentDTO, TimeOffRequestDTO, TimeOffStatus, TimeOffType };

export interface AdminTimeOffFilter {
  status?: TimeOffStatus;
  doctorId?: number;
  type?: TimeOffType;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
}

/** Admin version of TimeOffRequestDTO — includes doctorId, doctorName, reviewNotes */
export interface AdminTimeOffRequestDTO extends TimeOffRequestDTO {
  doctorId?: number;
  doctorName?: string;
  reviewNotes?: string;
}

const adminTimeOffService = {
  /**
   * List all time-off requests with optional filters.
   * GET /admin/time-off
   */
  list: async (filter: AdminTimeOffFilter = {}): Promise<AdminTimeOffRequestDTO[]> => {
    const params: Record<string, string> = {};
    if (filter.status)   params.status   = filter.status;
    if (filter.doctorId) params.doctorId = String(filter.doctorId);
    if (filter.type)     params.type     = filter.type;
    if (filter.dateFrom) params.dateFrom = filter.dateFrom;
    if (filter.dateTo)   params.dateTo   = filter.dateTo;

    const response = await api.get<AdminTimeOffRequestDTO[]>('/admin/time-off', { params });
    return response.data;
  },

  /**
   * Get a single time-off request by ID.
   * GET /admin/time-off/{id}
   */
  getById: async (id: number): Promise<AdminTimeOffRequestDTO> => {
    const response = await api.get<AdminTimeOffRequestDTO>(`/admin/time-off/${id}`);
    return response.data;
  },

  /**
   * Approve a time-off request.
   * PATCH /admin/time-off/{id}/approve
   */
  approve: async (id: number): Promise<AdminTimeOffRequestDTO> => {
    const response = await api.patch<AdminTimeOffRequestDTO>(`/admin/time-off/${id}/approve`);
    return response.data;
  },

  /**
   * Reject a time-off request with a reason.
   * PATCH /admin/time-off/{id}/reject
   */
  reject: async (id: number, reviewNotes: string): Promise<AdminTimeOffRequestDTO> => {
    const response = await api.patch<AdminTimeOffRequestDTO>(`/admin/time-off/${id}/reject`, {
      reviewNotes,
    });
    return response.data;
  },

  /**
   * Get appointments affected by a time-off request.
   * GET /admin/time-off/{id}/affected-appointments
   */
  getAffectedAppointments: async (id: number): Promise<AffectedAppointmentDTO[]> => {
    const response = await api.get<AffectedAppointmentDTO[]>(
      `/admin/time-off/${id}/affected-appointments`,
    );
    return response.data;
  },
};

export default adminTimeOffService;
