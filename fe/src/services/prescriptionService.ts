import api from './api';

// ==================== TYPES ====================

export interface PrescriptionItemDTO {
  id?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  unit?: string;
  instructions?: string;
  notes?: string;
  itemOrder?: number;
}

export interface PrescriptionCreateDTO {
  patientId: number;
  appointmentId?: number;
  prescriptionDate?: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
  items: PrescriptionItemDTO[];
}

export interface PrescriptionDTO {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  patientDateOfBirth?: string;
  patientGender?: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentId?: number;
  appointmentDate?: string;
  prescriptionDate: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
  isActive: boolean;
  items: PrescriptionItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionDetailDTO {
  id: number;
  prescriptionCode: string;
  prescribedDate: string;
  expiryDate?: string;
  status: string; // ACTIVE, EXPIRED
  diagnosis?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Patient info
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAddress?: string;
  medicalRecordNumber?: string;
  // Doctor info
  doctorId: number;
  doctorName: string;
  doctorEmail?: string;
  doctorSpecialization?: string;
  doctorLicenseNumber?: string;
  doctorSignature?: string;
  // Appointment info
  appointmentId?: number;
  appointmentCode?: string;
  appointmentDate?: string;
  // Medications
  medications: PrescriptionItemDTO[];
  // Additional
  generalNotes?: string;
}

export interface PrescriptionStatsDTO {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  cancelledPrescriptions: number;
  mostPrescribedMedications: MedicationStatsDTO[];
}

export interface MedicationStatsDTO {
  medicationName: string;
  genericName?: string;
  prescriptionCount: number;
  totalQuantity: number;
}

export interface PrescriptionFilterParams {
  search?: string;
  doctorId?: number;
  patientId?: number;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  format?: string;
}

export interface TemplateStatsDTO {
  totalPrescriptions: number;
  totalDoctors: number;
  totalPatients: number;
  totalMedicationsUsed: number;
  averageMedicationsPerPrescription: number;
  periodStart?: string;
  periodEnd?: string;
  activePrescriptions: number;
  expiredPrescriptions: number;
  prescriptionGrowthRate?: number;
  mostActiveDoctorName?: string;
  mostActiveDoctorPrescriptionCount?: number;
}

export interface DoctorTemplateStatsDTO {
  doctorId: number;
  doctorName: string;
  specialization?: string;
  totalPrescriptions: number;
  uniquePatients: number;
  totalMedications: number;
  averageMedicationsPerPrescription: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  topMedicationPrescribed?: string;
  topMedicationCount?: number;
}

export interface CommonMedicationDTO {
  medicationName: string;
  genericName?: string;
  category?: string;
  prescriptionCount: number;
  totalQuantity: number;
  uniqueDoctors: number;
  uniquePatients: number;
  mostCommonDosage?: string;
  mostCommonFrequency?: string;
  mostCommonDuration?: string;
  percentageOfTotal?: number;
}

export interface TrendDataPoint {
  period: string;
  periodStart: string;
  periodEnd: string;
  prescriptionCount: number;
  medicationCount: number;
  uniquePatients: number;
  uniqueDoctors: number;
}

export interface TemplateUsageTrendsDTO {
  periodStart: string;
  periodEnd: string;
  groupBy: string;
  trendData: TrendDataPoint[];
  totalPrescriptions: number;
  averagePrescriptionsPerPeriod: number;
  peakPeriod?: TrendDataPoint;
}

export interface SendPrescriptionEmailDTO {
  email: string;
  includePDF?: boolean;
  customMessage?: string;
  sendCopy?: boolean;
  patientRequested?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== API FUNCTIONS ====================

const prescriptionService = {
  // Doctor - Create prescription
  createPrescription: async (
    dto: PrescriptionCreateDTO
  ): Promise<PrescriptionDTO> => {
    const response = await api.post('/doctor/prescriptions', dto);
    return response.data;
  },

  // Doctor - Get prescription by ID
  getPrescription: async (id: number): Promise<PrescriptionDTO> => {
    const response = await api.get(`/doctor/prescriptions/${id}`);
    return response.data;
  },

  // Doctor - Get all prescriptions for current doctor
  getDoctorPrescriptions: async (
    params: PrescriptionFilterParams
  ): Promise<PageResponse<PrescriptionDTO>> => {
    const response = await api.get('/doctor/prescriptions', { params });
    return response.data;
  },

  // 6.1 - List all prescriptions (admin)
  getAllPrescriptions: async (
    params: PrescriptionFilterParams
  ): Promise<PageResponse<PrescriptionDTO>> => {
    const response = await api.get('/admin/prescriptions', { params });
    return response.data;
  },

  // 6.1 - Get prescription statistics
  getPrescriptionStatistics: async (
    from?: string,
    to?: string
  ): Promise<PrescriptionStatsDTO> => {
    const response = await api.get('/admin/prescriptions/statistics', {
      params: { from, to },
    });
    return response.data;
  },

  // 6.2 - Get prescription detail
  getPrescriptionDetail: async (id: number): Promise<PrescriptionDetailDTO> => {
    const response = await api.get(`/admin/prescriptions/${id}`);
    return response.data;
  },

  // 6.1 - Export prescriptions
  exportPrescriptions: async (
    params: PrescriptionFilterParams
  ): Promise<Blob> => {
    const response = await api.get('/admin/prescriptions/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // 6.2 - Download prescription PDF
  downloadPrescriptionPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/admin/prescriptions/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 6.2 - Print prescription
  printPrescription: async (id: number, format: string = 'PDF') => {
    const response = await api.get(`/admin/prescriptions/${id}/print`, {
      params: { format },
    });
    return response.data;
  },

  // 6.2 - Send prescription email
  sendPrescriptionEmail: async (id: number, dto: SendPrescriptionEmailDTO) => {
    const response = await api.post(
      `/admin/prescriptions/${id}/send-email`,
      dto
    );
    return response.data;
  },

  // 6.3 - Template statistics overview
  getTemplateStatistics: async (
    from?: string,
    to?: string
  ): Promise<TemplateStatsDTO> => {
    const response = await api.get('/admin/prescription-templates/statistics', {
      params: { from, to },
    });
    return response.data;
  },

  // 6.3 - Templates by doctor
  getTemplatesByDoctor: async (
    from?: string,
    to?: string,
    top: number = 10
  ): Promise<DoctorTemplateStatsDTO[]> => {
    const response = await api.get('/admin/prescription-templates/by-doctor', {
      params: { from, to, top },
    });
    return response.data;
  },

  // 6.3 - Common medications
  getCommonMedications: async (
    from?: string,
    to?: string,
    top: number = 20,
    groupBy: string = 'MEDICATION'
  ): Promise<CommonMedicationDTO[]> => {
    const response = await api.get(
      '/admin/prescription-templates/medications/common',
      { params: { from, to, top, groupBy } }
    );
    return response.data;
  },

  // 6.3 - Template usage trends
  getUsageTrends: async (
    from: string,
    to: string,
    groupBy: string = 'WEEK',
    doctorId?: number
  ): Promise<TemplateUsageTrendsDTO> => {
    const response = await api.get(
      '/admin/prescription-templates/usage-trends',
      { params: { from, to, groupBy, doctorId } }
    );
    return response.data;
  },

  // Helper: download file
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export default prescriptionService;
