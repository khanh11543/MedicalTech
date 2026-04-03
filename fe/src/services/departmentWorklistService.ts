import api from './api';

// =========== INTERFACES ===========

export interface WorklistItemDTO {
  id: number;
  serviceName: string;
  category: string;
  targetDepartment: string;
  price: number | null;
  priority: string;
  notes: string | null;
  status: string;
  orderedAt: string;
  orderedByDoctorName: string;
  assignedDoctorId: number | null;
  assignedDoctorName: string | null;
  patientName: string | null;
  patientId: number | null;
  appointmentCode: string | null;
  appointmentId: number | null;
  consultationId: number | null;
  hasResult: boolean;
  completedAt: string | null;
}

export interface ServiceResultDTO {
  id: number;
  serviceOrderId: number;
  findings: string | null;
  conclusion: string | null;
  notes: string | null;
  completedByDoctorName: string | null;
  completedByDoctorId: number | null;
  completedAt: string | null;
  isDraft: boolean;
  attachments: ServiceResultAttachmentDTO[];
  serviceName: string;
  category: string;
  patientName: string | null;
  appointmentCode: string | null;
  orderedByDoctorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceResultAttachmentDTO {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
}

export interface ServiceResultCreateDTO {
  findings: string;
  conclusion: string;
  notes: string;
  markCompleted: boolean;
}

// =========== DEPARTMENT LABELS ===========

export const DEPARTMENT_LABELS: Record<string, string> = {
  DIAGNOSTIC_IMAGING: 'Radiology / Diagnostic Imaging',
  LABORATORY: 'Laboratory',
  ULTRASOUND: 'Ultrasound',
  CARDIOLOGY_TEST: 'Cardiology',
  PATHOLOGY: 'Pathology',
  ENDOSCOPY: 'Endoscopy',
  OTHER: 'Other',
};

// =========== SERVICE ===========

class DepartmentWorklistService {
  /**
   * Get the current doctor's department
   */
  async getMyDepartment(): Promise<{ department: string; doctorName: string }> {
    const response = await api.get<{ department: string; doctorName: string }>(
      '/doctor/worklist/my-department'
    );
    return response.data;
  }

  /**
   * Get worklist items for current doctor's department
   */
  async getWorklist(status?: string): Promise<WorklistItemDTO[]> {
    const params = status ? { status } : {};
    const response = await api.get<WorklistItemDTO[]>('/doctor/worklist', { params });
    return response.data;
  }

  /**
   * Get a single service order detail
   */
  async getServiceOrderDetail(serviceOrderId: number): Promise<WorklistItemDTO> {
    const response = await api.get<WorklistItemDTO>(`/doctor/worklist/${serviceOrderId}`);
    return response.data;
  }

  /**
   * Start (accept) a service → PAID → IN_PROGRESS
   */
  async startService(serviceOrderId: number): Promise<WorklistItemDTO> {
    const response = await api.post<WorklistItemDTO>(
      `/doctor/worklist/${serviceOrderId}/start`
    );
    return response.data;
  }

  /**
   * Get the service result for a service order
   */
  async getResult(serviceOrderId: number): Promise<ServiceResultDTO> {
    const response = await api.get<ServiceResultDTO>(
      `/doctor/worklist/${serviceOrderId}/result`
    );
    return response.data;
  }

  /**
   * Save or complete a service result
   */
  async saveResult(serviceOrderId: number, dto: ServiceResultCreateDTO): Promise<ServiceResultDTO> {
    const response = await api.post<ServiceResultDTO>(
      `/doctor/worklist/${serviceOrderId}/result`,
      dto
    );
    return response.data;
  }

  /**
   * Upload an attachment to a service result
   */
  async uploadAttachment(serviceOrderId: number, file: File): Promise<ServiceResultDTO> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ServiceResultDTO>(
      `/doctor/worklist/${serviceOrderId}/result/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(serviceOrderId: number, attachmentId: number): Promise<void> {
    await api.delete(`/doctor/worklist/${serviceOrderId}/result/attachment/${attachmentId}`);
  }

  /**
   * Get service result for the primary doctor (read-only)
   */
  async getResultForPrimaryDoctor(serviceOrderId: number): Promise<ServiceResultDTO> {
    const response = await api.get<ServiceResultDTO>(
      `/doctor/service-orders/${serviceOrderId}/result`
    );
    return response.data;
  }
}

const departmentWorklistService = new DepartmentWorklistService();
export default departmentWorklistService;
