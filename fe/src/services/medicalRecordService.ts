import api from './api';

// =========== INTERFACES ===========

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  [key: string]: any;
}

export interface LabResult {
  name: string;
  value: string;
  unit?: string;
  normalRange?: string;
  status?: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
}

export interface MedicalRecordDTO {
  id: number;
  recordCode: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentId?: number;
  visitDate: string;
  chiefComplaint?: string;
  presentIllness?: string;
  vitalSigns?: VitalSigns;
  physicalExam?: string;
  diagnosis?: string;
  diagnosisCode?: string;
  treatmentPlan?: string;
  prescription?: string;
  labResults?: LabResult[];
  followUpDate?: string;
  followUpNotes?: string;
  attachments?: any;
  isConfidential?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface MedicalRecordFilterDTO {
  from?: string | null;
  to?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface MedicalRecordStatsDTO {
  totalRecords: number;
}

// =========== SERVICE ===========
const medicalRecordService = {
  // =========== DOCTOR APIs ===========

  /**
   * Get all medical records created by the authenticated doctor
   */
  getMyMedicalRecords: async (
    filter?: MedicalRecordFilterDTO
  ): Promise<PageResponse<MedicalRecordDTO>> => {
    const params = new URLSearchParams();

    if (filter?.from) params.append('from', filter.from);
    if (filter?.to) params.append('to', filter.to);
    params.append('pageNumber', (filter?.pageNumber ?? 0).toString());
    params.append('pageSize', (filter?.pageSize ?? 10).toString());

    const queryString = params.toString();
    const url = queryString
      ? `/doctor/medical-records?${queryString}`
      : `/doctor/medical-records`;

    const response = await api.get<PageResponse<MedicalRecordDTO>>(url);
    return response.data;
  },

  /**
   * Get medical records for a specific patient created by the doctor
   */
  getDoctorPatientRecords: async (
    patientId: number,
    pageNumber: number = 0,
    pageSize: number = 10
  ): Promise<PageResponse<MedicalRecordDTO>> => {
    const params = new URLSearchParams();
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    const response = await api.get<PageResponse<MedicalRecordDTO>>(
      `/doctor/medical-records/patient/${patientId}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a specific medical record detail created by the doctor
   */
  getMedicalRecordDetail: async (
    recordId: number
  ): Promise<MedicalRecordDTO> => {
    const response = await api.get<MedicalRecordDTO>(
      `/doctor/medical-records/${recordId}`
    );
    return response.data;
  },

  /**
   * Get the medical record linked to a specific appointment (doctor access)
   * Returns null if no medical record exists for the appointment
   */
  getRecordByAppointmentId: async (
    appointmentId: number
  ): Promise<MedicalRecordDTO | null> => {
    try {
      const response = await api.get<MedicalRecordDTO>(
        `/doctor/medical-records/appointment/${appointmentId}`
      );
      if (response.status === 204) return null;
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get medical records statistics for the authenticated doctor
   */
  getMedicalRecordStats: async (): Promise<MedicalRecordStatsDTO> => {
    const response = await api.get<MedicalRecordStatsDTO>(
      `/doctor/medical-records/stats/overview`
    );
    return response.data;
  },

  // =========== PATIENT APIs ===========

  /**
   * Get all medical records for the authenticated patient
   */
  getMyRecords: async (
    filter?: MedicalRecordFilterDTO
  ): Promise<PageResponse<MedicalRecordDTO>> => {
    const params = new URLSearchParams();

    if (filter?.from) params.append('from', filter.from);
    if (filter?.to) params.append('to', filter.to);
    params.append('pageNumber', (filter?.pageNumber ?? 0).toString());
    params.append('pageSize', (filter?.pageSize ?? 10).toString());

    const queryString = params.toString();
    const url = queryString
      ? `/patient/medical-records?${queryString}`
      : `/patient/medical-records`;

    const response = await api.get<PageResponse<MedicalRecordDTO>>(url);
    return response.data;
  },

  /**
   * Get a specific medical record for the patient
   */
  getRecordDetail: async (recordId: number): Promise<MedicalRecordDTO> => {
    const response = await api.get<MedicalRecordDTO>(
      `/patient/medical-records/${recordId}`
    );
    return response.data;
  },

  // =========== HELPER UTILITIES ===========

  /**
   * Format vital signs for display
   */
  formatVitalSigns: (vitalSigns?: VitalSigns): string[] => {
    if (!vitalSigns) return [];

    const formatted: string[] = [];

    if (vitalSigns.bloodPressure)
      formatted.push(`BP: ${vitalSigns.bloodPressure} mmHg`);
    if (vitalSigns.heartRate) formatted.push(`HR: ${vitalSigns.heartRate} bpm`);
    if (vitalSigns.temperature)
      formatted.push(`Temp: ${vitalSigns.temperature}°C`);
    if (vitalSigns.respiratoryRate)
      formatted.push(`RR: ${vitalSigns.respiratoryRate} /min`);
    if (vitalSigns.oxygenSaturation)
      formatted.push(`O₂: ${vitalSigns.oxygenSaturation}%`);
    if (vitalSigns.weight) formatted.push(`Weight: ${vitalSigns.weight} kg`);
    if (vitalSigns.height) formatted.push(`Height: ${vitalSigns.height} cm`);

    return formatted;
  },

  /**
   * Format date string to readable format
   */
  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  },

  /**
   * Format datetime string to readable format
   */
  formatDateTime: (dateTimeString: string): string => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeString;
    }
  },

  /**
   * Check if medical record is recent (within last 30 days)
   */
  isRecent: (visitDate: string): boolean => {
    try {
      const recordDate = new Date(visitDate).getTime();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return recordDate > thirtyDaysAgo;
    } catch {
      return false;
    }
  },

  /**
   * Get age of record in days
   */
  getRecordAgeDays: (visitDate: string): number => {
    try {
      const recordDate = new Date(visitDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      return Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  },

  /**
   * Format record code for display
   */
  formatRecordCode: (code: string): string => {
    return code || 'N/A';
  },

  /**
   * Check if record has critical information
   */
  hasCriticalInfo: (record: MedicalRecordDTO): boolean => {
    return Boolean(
      record.diagnosis || record.prescription || record.treatmentPlan
    );
  },

  /**
   * Get a summary text from medical record
   */
  getSummary: (record: MedicalRecordDTO): string => {
    const parts: string[] = [];

    if (record.diagnosis) parts.push(`Diagnosis: ${record.diagnosis}`);
    if (record.chiefComplaint)
      parts.push(`Chief Complaint: ${record.chiefComplaint}`);
    if (record.treatmentPlan) parts.push(`Treatment: ${record.treatmentPlan}`);

    return parts.join(' | ') || 'No summary available';
  },
};

export default medicalRecordService;
