import api from './api';

// ============== TYPES ==============

// Dashboard Types
export interface DoctorDashboard {
  todayAppointments: TodayAppointmentsCard;
  patientsWaiting: PatientsWaitingCard;
  inProgress: InProgressCard;
  upcoming: UpcomingCard;
  noShowRate: NoShowRateCard;
  rating: RatingCard;
  nextPatient: NextPatientPanel | null;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  quickActions: QuickActionsData;
  generatedAt: string;
  doctorId: number;
  doctorName: string;
}

export interface TodayAppointmentsCard {
  total: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  rescheduled: number;
}

export interface PatientsWaitingCard {
  waitingCount: number;
  avgWaitTimeMinutes: number;
  maxWaitTimeMinutes: number;
  hasLongWaitAlert: boolean;
  longWaitCount: number;
}

export interface InProgressCard {
  isExamining: boolean;
  currentAppointmentId: number | null;
  currentPatientName: string | null;
  startedAt: string | null;
  elapsedMinutes: number;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
}

export interface UpcomingCard {
  count: number;
  nextAppointment: NextAppointmentInfo | null;
}

export interface NextAppointmentInfo {
  appointmentId: number;
  patientName: string;
  startTime: string;
  endTime: string;
  queueNumber: number | null;
}

export interface NoShowRateCard {
  noShowRatePercent: number;
  noShowCount: number;
  totalWeekAppointments: number;
}

export interface RatingCard {
  averageRating: number;
  totalReviews: number;
  recentReviewsCount: number;
}

export interface NextPatientPanel {
  appointmentId: number;
  patientName: string | null;
  age: number | null;
  gender: string | null;
  appointmentCode: string | null;
  queueNumber: number | null;
  startTime: string;
  endTime: string;
  status: string;
  reasonForVisit: string | null;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface QuickActionsData {
  pendingConfirmations: number;
  checkedInCount: number;
  todayTotal: number;
}

// ============== TODAY (Queue / Timeline) TYPES ==============

export interface DoctorTodayData {
  doctorId: number;
  doctorStatus: string; // AVAILABLE | ON_BREAK | OFFLINE
  currentPatient: CurrentPatient | null;
  waitingQueue: QueueItem[];
  timeline: TimelineItem[];
  summary: QueueSummary;
  generatedAt: string;
}

export interface CurrentPatient {
  appointmentId: number;
  appointmentCode: string;
  queueNumber: number;
  patientName: string | null;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  reasonForVisit: string | null;
  startedAt: string;
  elapsedSeconds: number;
  scheduledStart: string;
  scheduledEnd: string;
  canComplete?: boolean;
  hasFinalizedRecord?: boolean;
  medicalRecordId?: number | null;
}

export interface QueueItem {
  appointmentId: number;
  appointmentCode: string;
  queueNumber: number;
  patientName: string | null;
  age: number | null;
  appointmentTime: string;
  checkedInAt: string | null;
  waitMinutes: number;
  status: string;
  isEmergency: boolean;
  waitLevel: string; // NORMAL | WARNING | CRITICAL
}

export interface TimelineItem {
  appointmentId: number;
  appointmentCode: string;
  queueNumber: number | null;
  patientName: string | null;
  age: number | null;
  startTime: string;
  endTime: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  isCurrentSlot: boolean;
  isNextSlot: boolean;
  reasonForVisit: string | null;
  needsFollowUp: boolean;
}

export interface QueueSummary {
  totalToday: number;
  waiting: number;
  completed: number;
  noShow: number;
  cancelled: number;
  notCheckedIn: number;
  inProgress: number;
}

// ============== API CALLS ==============

/**
 * Get doctor dashboard overview
 * GET /api/doctor/dashboard
 */
export const getDoctorDashboard = async (): Promise<DoctorDashboard> => {
  const response = await api.get<DoctorDashboard>('/doctor/dashboard');
  return response.data;
};

// ---------- Today (Queue / Timeline) ----------

export const getDoctorToday = async (): Promise<DoctorTodayData> => {
  const response = await api.get<DoctorTodayData>('/doctor/today');
  return response.data;
};

export const callNextPatient = async (): Promise<void> => {
  await api.post('/doctor/today/call-next');
};

export const callPatient = async (appointmentId: number): Promise<void> => {
  await api.post(`/doctor/today/call/${appointmentId}`);
};

export const completeConsultation = async (
  appointmentId: number
): Promise<void> => {
  await api.post(`/doctor/today/complete/${appointmentId}`);
};

export const skipPatient = async (
  appointmentId: number,
  reason: string
): Promise<void> => {
  await api.post(`/doctor/today/skip/${appointmentId}`, { reason });
};

export const markNoShow = async (
  appointmentId: number,
  reason: string
): Promise<void> => {
  await api.post(`/doctor/today/no-show/${appointmentId}`, { reason });
};

export const changeDoctorStatus = async (status: string): Promise<void> => {
  await api.post('/doctor/today/status', { status });
};

export const reorderQueue = async (
  orderedAppointmentIds: number[],
  reason: string
): Promise<void> => {
  await api.post('/doctor/today/reorder', { orderedAppointmentIds, reason });
};

export const sendToReception = async (
  appointmentId: number,
  message?: string
): Promise<void> => {
  await api.post(
    `/doctor/today/send-to-reception/${appointmentId}`,
    message != null ? { message } : {}
  );
};

// ============== PROFILE SETUP TYPES ==============

export interface DoctorProfile {
  id: number;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  specialization: string | null;
  specialtyIds?: number[];
  primarySpecialtyId?: number | null;
  licenseNumber: string | null;
  experienceYears: number;
  education: string | null;
  bio: string | null;
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  profileComplete: boolean;
  documentsComplete: boolean;
  canSubmitVerification: boolean;
}

export interface UpdateDoctorProfile {
  specialization?: string;
  specialtyIds?: number[];
  primarySpecialtyId?: number;
  licenseNumber?: string;
  experienceYears?: number;
  education?: string;
  bio?: string;
  hospitalAffiliation?: string;
  officeAddress?: string;
}

export interface DoctorDocumentDTO {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorEmail: string;
  docType: string;
  docTypeDescription: string;
  fileUrl: string;
  fileHash: string | null;
  status: string;
  reviewedById: number | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface DocumentVerificationSummary {
  totalDocuments: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  hasLicense: boolean;
  hasId: boolean;
  hasDegree: boolean;
  isComplete: boolean;
}

// ============== DOCTOR'S PATIENTS TYPES ==============

/**
 * Generic pagination response wrapper
 */
export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Patient in "My Patients" tab
 * Contains patient basics, medical history, and visit summary
 */
export interface DoctorPatientDTO {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  totalVisits: number;
  lastVisitDate: string | null;
  lastVisitReason: string | null;
  activePrescriptionsCount: number;
  totalPrescriptionsCount: number;
  mostRecentPrescriptionDate: string | null;
  allergyList: string[];
  chronicConditions: string[];
  hasUpcomingAppointment: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Patient in "Recent" tab
 * Optimized for quick access and follow-up support
 */
export interface DoctorPatientRecentDTO {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  lastVisitDate: string | null;
  daysSinceLastVisit: number;
  lastVisitReason: string | null;
  lastVisitNotes: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  hasUpcomingAppointment: boolean;
  nextAppointmentDate: string | null;
  lastAppointmentId: number | null;
  lastMedicalRecordId: number | null;
}

/**
 * Patient in "Flags" tab
 * Contains clinical flags for safety awareness
 */
export interface DoctorPatientFlagsDTO {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: string | null;
  allergies: string[];
  chronicConditions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastVisitDate: string | null;
  lastVisitNotes: string | null;
  hasActivePrescriptions: boolean;
  activePrescriptionsCount: number;
  updatedAt: string;
}

/**
 * Detailed patient information
 * Contains complete medical history, visit records, and prescriptions
 */
export interface DoctorPatientDetailDTO {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  age: number;
  gender: string | null;
  address: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  insuranceNumber: string | null;
  emergencyContact: string | null;
  totalVisitsWithThisDoctor: number;
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  lastVisitReason: string | null;
  lastVisitNotes: string | null;
  totalMedicalRecords: number;
  recentMedicalRecords: MedicalRecordSummary[];
  totalPrescriptions: number;
  activePrescriptions: number;
  recentPrescriptions: PrescriptionSummary[];
  upcomingAppointments: AppointmentSummary[];
  allergyList: string[];
  chronicConditionsList: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordSummary {
  id: number;
  visitDate: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
}

export interface PrescriptionSummary {
  id: number;
  prescriptionCode: string;
  prescriptionDate: string;
  diagnosis: string | null;
  status: string;
}

export interface AppointmentSummary {
  id: number;
  appointmentCode: string;
  appointmentDate: string;
  appointmentType: string | null;
  status: string;
  reasonForVisit: string | null;
}

/**
 * Cohort statistics
 */
export interface DoctorPatientCohortStatsDTO {
  totalPatients: number;
  patientsInLast30Days: number;
  patientsInLast90Days: number;
  patientsWithAllergies: number;
  patientsWithChronicConditions: number;
  highRiskPatients: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  patientsWithActivePrescriptions: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  upcomingAppointments: number;
  averageVisitsPerPatient: number;
  patientsWithFollowUp: number;
}

export interface DoctorPatientSearchParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

// ============== PROFILE SETUP API CALLS ==============

/** GET /api/doctor/profile */
export const getDoctorProfile = async (): Promise<DoctorProfile> => {
  const response = await api.get<DoctorProfile>('/doctor/profile');
  return response.data;
};

/** PUT /api/doctor/profile */
export const updateDoctorProfile = async (
  data: UpdateDoctorProfile
): Promise<DoctorProfile> => {
  const response = await api.put<DoctorProfile>('/doctor/profile', data);
  return response.data;
};

/** POST /api/doctor/profile/upload-document */
export const uploadDoctorDocument = async (
  file: File,
  docType: string
): Promise<DoctorDocumentDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('docType', docType);
  const response = await api.post<DoctorDocumentDTO>(
    '/doctor/profile/upload-document',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

/** GET /api/doctor/documents */
export const getDoctorDocuments = async (): Promise<DoctorDocumentDTO[]> => {
  const response = await api.get<DoctorDocumentDTO[]>('/doctor/documents');
  return response.data;
};

/** DELETE /api/doctor/documents/:id */
export const deleteDoctorDocument = async (
  documentId: number
): Promise<void> => {
  await api.delete(`/doctor/documents/${documentId}`);
};

/** GET /api/doctor/documents/verification-summary */
export const getDocumentVerificationSummary =
  async (): Promise<DocumentVerificationSummary> => {
    const response = await api.get<DocumentVerificationSummary>(
      '/doctor/documents/verification-summary'
    );
    return response.data;
  };

/** POST /api/doctor/profile/submit-verification */
export const submitDoctorVerification = async (): Promise<DoctorProfile> => {
  const response = await api.post<DoctorProfile>(
    '/doctor/profile/submit-verification'
  );
  return response.data;
};

// ============== DOCTOR'S PATIENT MANAGEMENT API CALLS ==============

/**
 * Get all patients of the doctor with optional search and pagination
 * GET /api/doctor/my-patients
 */
export const getMyPatients = async (
  params?: DoctorPatientSearchParams
): Promise<PageResponse<DoctorPatientDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientDTO>>(
    '/doctor/my-patients',
    {
      params: {
        search: params?.search || undefined,
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
        sortBy: params?.sortBy || 'id',
        sortOrder: params?.sortOrder || 'desc',
      },
    }
  );
  return response.data;
};

/**
 * Get detailed information for a specific patient
 * GET /api/doctor/my-patients/{patientId}
 */
export const getPatientDetail = async (
  patientId: number
): Promise<DoctorPatientDetailDTO> => {
  const response = await api.get<DoctorPatientDetailDTO>(
    `/doctor/my-patients/${patientId}`
  );
  return response.data;
};

/**
 * Get recently seen patients (last 30 days)
 * GET /api/doctor/my-patients/recent
 */
export const getRecentPatients = async (params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<PageResponse<DoctorPatientRecentDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientRecentDTO>>(
    '/doctor/my-patients/recent',
    {
      params: {
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
      },
    }
  );
  return response.data;
};

/**
 * Get patients with clinical flags (allergies or chronic conditions)
 * GET /api/doctor/my-patients/flags
 */
export const getPatientsWithFlags = async (params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<PageResponse<DoctorPatientFlagsDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientFlagsDTO>>(
    '/doctor/my-patients/flags',
    {
      params: {
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
      },
    }
  );
  return response.data;
};

/**
 * Get patients with allergies only
 * GET /api/doctor/my-patients/flags/allergies
 */
export const getPatientsWithAllergies = async (params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<PageResponse<DoctorPatientFlagsDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientFlagsDTO>>(
    '/doctor/my-patients/flags/allergies',
    {
      params: {
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
      },
    }
  );
  return response.data;
};

/**
 * Get patients with chronic conditions only
 * GET /api/doctor/my-patients/flags/chronic-conditions
 */
export const getPatientsWithChronicConditions = async (params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<PageResponse<DoctorPatientFlagsDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientFlagsDTO>>(
    '/doctor/my-patients/flags/chronic-conditions',
    {
      params: {
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
      },
    }
  );
  return response.data;
};

/**
 * Get high-risk patients (severe allergies or multiple chronic conditions)
 * GET /api/doctor/my-patients/flags/high-risk
 */
export const getHighRiskPatients = async (params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<PageResponse<DoctorPatientFlagsDTO>> => {
  const response = await api.get<PageResponse<DoctorPatientFlagsDTO>>(
    '/doctor/my-patients/flags/high-risk',
    {
      params: {
        pageNumber: params?.pageNumber ?? 0,
        pageSize: params?.pageSize ?? 10,
      },
    }
  );
  return response.data;
};

/**
 * Get cohort statistics
 * GET /api/doctor/my-patients/stats
 */
export const getPatientCohortStats =
  async (): Promise<DoctorPatientCohortStatsDTO> => {
    const response = await api.get<DoctorPatientCohortStatsDTO>(
      '/doctor/my-patients/stats'
    );
    return response.data;
  };

// ============== DOCTOR'S APPOINTMENT MANAGEMENT API CALLS ==============

/** PATCH /api/appointments/{id}/reschedule - Reschedule an appointment */
export const rescheduleAppointment = async (
  appointmentId: number,
  data: {
    newDate: string; // yyyy-MM-dd
    newStartTime: string; // HH:mm
    newEndTime: string; // HH:mm
    reason?: string;
  }
): Promise<any> => {
  const response = await api.patch(
    `/appointments/${appointmentId}/reschedule`,
    data
  );
  return response.data;
};
