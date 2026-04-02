import { apiFetch } from '@/services/apiClient';

export type FavoriteDoctorDto = {
  id: number;
  doctorId: number;
  doctorName?: string | null;
  avatarUrl?: string | null;
  specialties?: string[] | null;
  experienceYears?: number | null;
  consultationFee?: number | string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | null;
  hospitalAffiliation?: string | null;
  isAvailable?: boolean | null;
  createdAt?: string | null;
};

export type FavoriteListResponse = {
  favorites: FavoriteDoctorDto[];
  totalPages?: number;
  totalElements?: number;
  currentPage?: number;
  pageSize?: number;
};

export async function fetchPatientFavorites(patientId: number, pageNumber = 0, pageSize = 200): Promise<FavoriteListResponse> {
  const q = new URLSearchParams({
    patientId: String(patientId),
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  return apiFetch<FavoriteListResponse>(`/patient/favorites?${q.toString()}`);
}

export async function addPatientFavorite(patientId: number, doctorId: number): Promise<FavoriteDoctorDto> {
  const q = new URLSearchParams({ patientId: String(patientId) });
  return apiFetch<FavoriteDoctorDto>(`/patient/favorites?${q.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ doctorId }),
  });
}

export async function removePatientFavorite(patientId: number, favoriteId: number): Promise<void> {
  const q = new URLSearchParams({ patientId: String(patientId) });
  await apiFetch(`/patient/favorites/${favoriteId}?${q.toString()}`, { method: 'DELETE' });
}

