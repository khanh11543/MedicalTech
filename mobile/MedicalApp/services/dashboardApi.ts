import { apiFetch, ApiError } from '@/services/apiClient';

export type SpringPage<T> = {
  content: T[];
  totalElements?: number;
};

export type PatientDashboardStats = {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  totalMedicalRecords: number;
  totalPayments: number;
  pendingPayments: number;
  nextAppointment: AppointmentDto | null;
  generatedAt?: string;
};

export type AppointmentDto = {
  id: number;
  appointmentCode?: string;
  doctorId?: number;
  doctorName?: string;
  doctorSpecialization?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status?: string;
  consultationFee?: number | string | null;
  paymentStatus?: string | null;
  paymentId?: number | null;
  prescriptionId?: number | null;
  prescriptionPaymentStatus?: string | null;
  prescriptionTotalCost?: number | string | null;
  hasReview?: boolean;
};

export type PatientProfile = {
  userId: number;
  patientId: number;
  fullName?: string;
  email?: string;
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

export type SpecialtyDto = {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  slug?: string;
  subtitle?: string | null;
};

export type DoctorCardDto = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  primarySpecialty?: string | null;
  specialties?: string[];
  experienceYears?: number | null;
  consultationFee?: number | string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | null;
  city?: string | null;
};

export type PublicContentDto = {
  id: number;
  title: string;
  body?: string | null;
  summary?: string | null;
  type?: string;
};

export async function fetchPatientDashboardStats(): Promise<PatientDashboardStats | null> {
  try {
    return await apiFetch<PatientDashboardStats>('/patient/dashboard/stats');
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 404)) {
      return null;
    }
    throw e;
  }
}

export async function fetchPatientProfile(): Promise<PatientProfile | null> {
  try {
    return await apiFetch<PatientProfile>('/patient/profile');
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403 || e.status === 404)) {
      return null;
    }
    throw e;
  }
}

export async function fetchPublicSpecialties(): Promise<SpecialtyDto[]> {
  const list = await apiFetch<SpecialtyDto[]>('/public/specialties?isActive=true', { skipAuth: true });
  return Array.isArray(list) ? list : [];
}

export type PublicDoctorsQuery = {
  q?: string;
  specialtyId?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
};

export async function fetchPublicDoctorsPage(query: PublicDoctorsQuery = {}): Promise<DoctorCardDto[]> {
  const pageNumber = query.pageNumber ?? 0;
  const pageSize = query.pageSize ?? 20;
  const sortBy = query.sortBy ?? 'ratingAvg';
  const sortOrder = query.sortOrder ?? 'desc';
  const params = new URLSearchParams();
  params.set('pageNumber', String(pageNumber));
  params.set('pageSize', String(pageSize));
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.specialtyId != null) params.set('specialtyId', String(query.specialtyId));
  const page = await apiFetch<SpringPage<DoctorCardDto>>(`/public/doctors?${params.toString()}`, {
    skipAuth: true,
  });
  return page?.content ?? [];
}

export async function fetchTopDoctors(size = 10): Promise<DoctorCardDto[]> {
  return fetchPublicDoctorsPage({ pageNumber: 0, pageSize: size, sortBy: 'ratingAvg', sortOrder: 'desc' });
}

export async function fetchGuideContents(limit = 6): Promise<PublicContentDto[]> {
  const page = await apiFetch<SpringPage<PublicContentDto>>(
    `/public/contents?type=GUIDE&pageNumber=0&pageSize=${limit}`,
    { skipAuth: true }
  );
  const guides = page?.content ?? [];
  if (guides.length > 0) return guides;
  const articles = await apiFetch<SpringPage<PublicContentDto>>(
    `/public/contents?type=ARTICLE&pageNumber=0&pageSize=${limit}`,
    { skipAuth: true }
  );
  return articles?.content ?? [];
}
