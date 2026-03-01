import api from "./api";

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
  const response = await api.get<DoctorDashboard>("/doctor/dashboard");
  return response.data;
};

// ---------- Today (Queue / Timeline) ----------

export const getDoctorToday = async (): Promise<DoctorTodayData> => {
  const response = await api.get<DoctorTodayData>("/doctor/today");
  return response.data;
};

export const callNextPatient = async (): Promise<void> => {
  await api.post("/doctor/today/call-next");
};

export const callPatient = async (appointmentId: number): Promise<void> => {
  await api.post(`/doctor/today/call/${appointmentId}`);
};

export const completeConsultation = async (appointmentId: number): Promise<void> => {
  await api.post(`/doctor/today/complete/${appointmentId}`);
};

export const skipPatient = async (appointmentId: number, reason: string): Promise<void> => {
  await api.post(`/doctor/today/skip/${appointmentId}`, { reason });
};

export const markNoShow = async (appointmentId: number): Promise<void> => {
  await api.post(`/doctor/today/no-show/${appointmentId}`);
};

export const changeDoctorStatus = async (status: string): Promise<void> => {
  await api.post("/doctor/today/status", { status });
};
