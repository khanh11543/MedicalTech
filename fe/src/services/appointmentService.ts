import api from "./api";

// Appointment interface based on API response
export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  doctorEmail: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedBy: string;
  bookedByUserName: string;
  symptoms: string;
  cancellationReason: string;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sort interface
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

// Pageable interface
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

// Paginated response interface
export interface PaginatedAppointments {
  content: Appointment[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Query parameters for getting doctor appointments
export interface GetDoctorAppointmentsParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  search?: string;
}

/**
 * Fetch doctor appointments with optional filters
 * @param params - Query parameters (pagination, sorting, filtering)
 * @returns Promise with paginated appointments
 */
export const getDoctorAppointments = async (
  params?: GetDoctorAppointmentsParams
): Promise<PaginatedAppointments> => {
  const response = await api.get<PaginatedAppointments>("/doctor/appointments", {
    params,
  });
  return response.data;
};

/**
 * Get a single appointment by ID
 * @param appointmentId - The appointment ID
 * @returns Promise with appointment details
 */
export const getAppointmentDetails = async (
  appointmentId: number
): Promise<Appointment> => {
  const response = await api.get<Appointment>(`/doctor/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Cancel an appointment
 * @param appointmentId - The appointment ID to cancel
 * @param reason - Reason for cancellation
 * @returns Promise with updated appointment
 */
export const cancelAppointment = async (
  appointmentId: number,
  reason?: string
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/appointments/${appointmentId}/cancel`,
    { reason }
  );
  return response.data;
};

/**
 * Request to reschedule an appointment
 * @param appointmentId - The appointment ID
 * @param newDate - New date for the appointment
 * @param reason - Optional reason for rescheduling
 * @returns Promise with updated appointment
 */
export const requestRescheduleAppointment = async (
  appointmentId: number,
  newDate: string,
  reason?: string
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/appointments/${appointmentId}/reschedule`,
    { newDate, reason }
  );
  return response.data;
};

/**
 * Confirm a pending appointment
 * @param appointmentId - The appointment ID to confirm
 * @returns Promise with updated appointment
 */
export const confirmAppointment = async (
  appointmentId: number
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/doctor/appointments/${appointmentId}/confirm`
  );
  return response.data;
};
