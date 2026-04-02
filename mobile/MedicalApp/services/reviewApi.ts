import { apiFetch } from '@/services/apiClient';

export type CreatePatientReviewPayload = {
  appointmentId: number;
  doctorId?: number | null;
  rating: number;
  comment?: string | null;
  isAnonymous?: boolean | null;
  imageUrls?: string[] | null;
};

export type ReviewDto = {
  id: number;
  appointmentId?: number | null;
  patientId?: number | null;
  patientName?: string | null;
  doctorId?: number | null;
  doctorName?: string | null;
  rating: number;
  comment?: string | null;
  imageUrls?: string[];
  isAnonymous?: boolean | null;
  createdAt?: string | null;
};

export async function createPatientReview(payload: CreatePatientReviewPayload): Promise<ReviewDto> {
  return apiFetch<ReviewDto>('/patient/reviews', {
    method: 'POST',
    body: JSON.stringify({
      appointmentId: payload.appointmentId,
      doctorId: payload.doctorId ?? undefined,
      rating: payload.rating,
      comment: payload.comment ?? undefined,
      isAnonymous: payload.isAnonymous ?? false,
      imageUrls: payload.imageUrls ?? undefined,
    }),
  });
}

