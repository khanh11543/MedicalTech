import { apiFetch } from '@/services/apiClient';
import type { AppointmentDto } from '@/services/dashboardApi';

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type PatientProfileFull = {
  userId: number;
  patientId: number;
  email: string;
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  idNumber?: string | null;
  insuranceNumber?: string | null;
  insuranceProvider?: string | null;
  emergencyContact?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
};

export type UpdatePatientProfilePayload = {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string;
  idNumber?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
};

export async function fetchPatientProfileFull(): Promise<PatientProfileFull> {
  return apiFetch<PatientProfileFull>('/patient/profile');
}

export async function putPatientProfile(body: UpdatePatientProfilePayload): Promise<PatientProfileFull> {
  return apiFetch<PatientProfileFull>('/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function fetchPatientAppointments(params: {
  pageNumber?: number;
  pageSize?: number;
  statuses?: string;
}): Promise<SpringPage<AppointmentDto>> {
  const q = new URLSearchParams();
  q.set('pageNumber', String(params.pageNumber ?? 0));
  q.set('pageSize', String(params.pageSize ?? 80));
  if (params.statuses) q.set('statuses', params.statuses);
  return apiFetch<SpringPage<AppointmentDto>>(`/patient/appointments?${q.toString()}`);
}

export async function cancelPatientAppointment(appointmentId: number, reason: string): Promise<AppointmentDto> {
  return apiFetch<AppointmentDto>(`/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export type MedicalRecordDto = {
  id: number;
  recordCode?: string;
  doctorId?: number;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentId?: number;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  labResults?: unknown;
  treatmentPlan?: string;
  isConfidential?: boolean;
};

export async function fetchPatientMedicalRecords(params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<SpringPage<MedicalRecordDto>> {
  const q = new URLSearchParams();
  q.set('pageNumber', String(params?.pageNumber ?? 0));
  q.set('pageSize', String(params?.pageSize ?? 30));
  return apiFetch<SpringPage<MedicalRecordDto>>(`/patient/medical-records?${q.toString()}`);
}

export type PrescriptionDto = {
  id: number;
  prescriptionCode?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentId?: number;
  prescriptionDate?: string;
  status?: string;
  diagnosis?: string;
  notes?: string;
  totalCost?: number | string | null;
  prescriptionPaymentStatus?: string | null;
  items?: unknown[];
};

export async function fetchPatientPrescription(id: number): Promise<PrescriptionDto> {
  return apiFetch<PrescriptionDto>(`/patient/prescriptions/${id}`);
}

/** Patient payment detail — amounts are stored in `currency` (typically VND), same as web. */
export type PatientPaymentDto = {
  id: number;
  paymentCode: string;
  appointmentId?: number;
  appointmentCode?: string;
  amount?: number | string | null;
  discountAmount?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
  currency?: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  appointmentDate?: string | null;
};

export type PaymentInitDto = {
  paymentId: number;
  paymentCode: string;
  payUrl: string;
  qrCodeUrl: string;
  orderId: string;
  message: string;
  success: boolean;
};

export type PaymentQrDto = {
  id?: number;
  paymentId: number;
  provider?: string;
  qrPayload: string;
  payUrl: string;
  expiresAt?: string;
  status?: string;
};

export async function fetchPatientPayment(id: number): Promise<PatientPaymentDto> {
  return apiFetch<PatientPaymentDto>(`/patient/payments/${id}`);
}

export async function initPatientMomoPayment(paymentId: number): Promise<PaymentInitDto> {
  return apiFetch<PaymentInitDto>(`/patient/payments/${paymentId}/momo/init`, {
    method: 'POST',
    body: '{}',
  });
}

export async function fetchPatientPaymentQr(paymentId: number): Promise<PaymentQrDto> {
  return apiFetch<PaymentQrDto>(`/patient/payments/${paymentId}/qr`);
}
