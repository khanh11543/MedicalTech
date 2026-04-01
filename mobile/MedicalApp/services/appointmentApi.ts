import { apiFetch } from '@/services/apiClient';
import type { AppointmentDto, SpecialtyDto } from '@/services/dashboardApi';

/** Matches backend `DoctorDetailDTO` (public doctor profile). */
export type DoctorDetailPublic = {
  id: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  licenseNumber?: string | null;
  bio?: string | null;
  education?: string | null;
  experienceYears?: number | null;
  primarySpecialty?: string | null;
  specialties?: SpecialtyDto[];
  consultationFee?: number | string | null;
  followUpFee?: number | string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | null;
  hospitalAffiliation?: string | null;
  officeAddress?: string | null;
  isAvailable?: boolean | null;
  verificationStatus?: string | null;
};

/** Backend `PublicReviewDTO` — visible patient reviews for a doctor. */
export type PublicReviewDto = {
  id: number;
  patientName: string;
  doctorName?: string | null;
  doctorSpecialty?: string | null;
  rating: number;
  comment?: string | null;
  imageUrls?: string[];
  isAnonymous?: boolean | null;
  createdAt?: string | null;
};

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type TimeSlotDto = {
  id: number;
  doctorId?: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  isAvailable?: boolean | null;
};

/** Spring/Jackson may send LocalDate as "yyyy-MM-dd" or [y,m,d]; normalize for UI and filters. */
export function normalizeSlotDate(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') {
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    const y = Number(raw[0]);
    const mo = Number(raw[1]);
    const d = Number(raw[2]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return '';
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(raw);
}

/** LocalTime as "HH:mm", "HH:mm:ss", or array [h,m,s]. */
export function normalizeSlotTime(raw: unknown): string {
  if (raw == null) return '00:00';
  if (typeof raw === 'string') {
    const parts = raw.trim().split(':');
    if (parts.length >= 2) {
      const hNum = parseInt(parts[0], 10);
      const mNum = parseInt(parts[1], 10);
      if (!Number.isFinite(hNum) || !Number.isFinite(mNum)) return '00:00';
      return `${String(hNum).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
    }
    return raw;
  }
  if (Array.isArray(raw) && raw.length >= 2) {
    const h = Number(raw[0]);
    const m = Number(raw[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '00:00';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return '00:00';
}

/** Slot start as milliseconds in the device's local timezone. */
export function getSlotStartLocalMs(slot: TimeSlotDto): number {
  const date = normalizeSlotDate(slot.slotDate as unknown);
  const time = normalizeSlotTime(slot.startTime as unknown);
  if (!date) return 0;
  const local = new Date(`${date}T${time}:00`);
  const ms = local.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Only slots that start strictly after `now` (past calendar times hidden). */
export function filterSlotsStartingInFuture(slots: TimeSlotDto[], now: Date = new Date()): TimeSlotDto[] {
  const t = now.getTime();
  return slots.filter((s) => getSlotStartLocalMs(s) > t);
}

function normalizeSlot(raw: TimeSlotDto): TimeSlotDto {
  return {
    ...raw,
    id: Number(raw.id),
    slotDate: normalizeSlotDate(raw.slotDate as unknown),
    startTime: normalizeSlotTime(raw.startTime as unknown),
    endTime: normalizeSlotTime((raw.endTime ?? raw.startTime) as unknown),
  };
}

export async function fetchDoctorDetailPublic(doctorId: number): Promise<DoctorDetailPublic> {
  return apiFetch<DoctorDetailPublic>(`/public/doctors/${doctorId}`, { skipAuth: true });
}

export async function fetchDoctorReviewsPublic(
  doctorId: number,
  pageNumber = 0,
  pageSize = 30
): Promise<SpringPage<PublicReviewDto>> {
  const qs = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  return apiFetch<SpringPage<PublicReviewDto>>(`/public/doctors/${doctorId}/reviews?${qs}`, {
    skipAuth: true,
  });
}

export async function fetchDoctorSlotsPublic(
  doctorId: number,
  dateFrom: string,
  dateTo: string
): Promise<TimeSlotDto[]> {
  const qs = new URLSearchParams({ dateFrom, dateTo });
  const list = await apiFetch<TimeSlotDto[]>(`/public/doctors/${doctorId}/slots?${qs}`, {
    skipAuth: true,
  });
  return Array.isArray(list) ? list : [];
}

export type BookAppointmentPayload = {
  /** Server replaces with the logged-in patient (`PatientAppointmentController`). Any non-null number is fine. */
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlotId: number;
  reasonForVisit?: string;
};

export async function bookPatientAppointment(body: BookAppointmentPayload): Promise<AppointmentDto> {
  return apiFetch<AppointmentDto>('/patient/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
