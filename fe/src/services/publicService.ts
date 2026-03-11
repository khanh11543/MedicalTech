import api from "./api";

// ==================== TYPES ====================

export interface Specialty {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  imageUrl: string | null;
  slug: string | null;
  subtitle: string | null;
  highlights: string | null;
  isActive: boolean;
}

export interface DoctorCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  primarySpecialty: string;
  specialties: string[];
  experienceYears: number;
  consultationFee: number;
  ratingAvg: number;
  ratingCount: number;
  hospitalAffiliation: string | null;
  city: string | null;
  officeAddress: string | null;
  isAvailable: boolean;
}

export interface PublicReview {
  id: number;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  isAnonymous: boolean;
  createdAt: string;
}

export interface PublicContent {
  id: number;
  title: string;
  body: string;
  summary: string;
  type: string;
  author: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  createdAt: string;
}

export interface DoctorDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  licenseNumber: string;
  bio: string;
  education: string;
  experienceYears: number;
  primarySpecialty: string;
  specialties: { id: number; name: string }[];
  consultationFee: number;
  followUpFee: number;
  ratingAvg: number;
  ratingCount: number;
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  isAvailable: boolean;
  verificationStatus: string;
}

export interface TimeSlot {
  id: number;
  doctorId: number;
  doctorName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ==================== SERVICE ====================

const publicService = {
  // Get all specialties
  getSpecialties: async (): Promise<Specialty[]> => {
    const response = await api.get("/public/specialties");
    return response.data;
  },

  // Get specialty by slug
  getSpecialtyBySlug: async (slug: string): Promise<Specialty> => {
    const response = await api.get(`/public/specialties/${slug}`);
    return response.data;
  },

  // Search doctors (paginated)
  getDoctors: async (params?: {
    q?: string;
    specialtyId?: number;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PageResponse<DoctorCard>> => {
    const response = await api.get("/public/doctors", { params });
    return response.data;
  },

  // Get reviews (paginated)
  getReviews: async (params?: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<PublicReview>> => {
    const response = await api.get("/public/reviews", { params });
    return response.data;
  },

  // Get contents by type (e.g. FAQ)
  getContents: async (
    type: string,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<PageResponse<PublicContent>> => {
    const response = await api.get("/public/contents", {
      params: { type, ...params },
    });
    return response.data;
  },

  // Get doctor detail
  getDoctorDetail: async (id: number): Promise<DoctorDetail> => {
    const response = await api.get(`/public/doctors/${id}`);
    return response.data;
  },

  // Get doctor available slots
  getDoctorSlots: async (
    doctorId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<TimeSlot[]> => {
    const response = await api.get(`/public/doctors/${doctorId}/slots`, {
      params: { dateFrom, dateTo },
    });
    return response.data.content || response.data;
  },

  // Get doctor reviews
  getDoctorReviews: async (
    doctorId: number,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<PageResponse<PublicReview>> => {
    const response = await api.get(`/public/doctors/${doctorId}/reviews`, { params });
    return response.data;
  },

  // Submit contact form
  submitContact: async (data: ContactMessage): Promise<string> => {
    const response = await api.post("/public/contact", data);
    return response.data;
  },

};

export default publicService;
