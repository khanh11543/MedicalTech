import api from './api';

export interface ConsultationRecord {
  id?: string;
  appointmentId: number;
  status: 'DRAFT' | 'FINALIZED' | 'AMENDED';
  chiefComplaint: string;
  hpi: string;
  vitals: {
    temperature: number | null;
    systolic: number | null;
    diastolic: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    height: number | null;
    weight: number | null;
    bmi: number | null;
  };
  physicalExam: string;
  diagnosis: string;
  diagnosticCode: string;
  plan: string;
  followUpInstructions: string;
  attachments: Array<{
    id: string;
    filename: string;
    type: string;
    uploadedAt: string;
  }>;
  lastSavedAt: string;
  finalizedAt?: string;
  additionalNotes?: string;
}

export interface Amendment {
  id: string;
  content: string;
  createdAt: string;
  signedAt?: string;
}

class ConsultationService {
  /**
   * Fetch all draft consultations for the current doctor
   */
  async getDraftConsultations(): Promise<ConsultationRecord[]> {
    try {
      const response = await api.get(`/doctor/consultations/drafts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching draft consultations:', error);
      throw error;
    }
  }

  /**
   * Fetch existing consultation record for an appointment
   */
  async getConsultation(appointmentId: number): Promise<ConsultationRecord> {
    try {
      const response = await api.get(`/doctor/consultations/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }
  }

  /**
   * Save draft of consultation record
   */
  async saveDraft(
    consultation: ConsultationRecord
  ): Promise<ConsultationRecord> {
    try {
      const response = await api.post(
        `/doctor/consultations/${consultation.appointmentId}/draft`,
        consultation
      );
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Finalize consultation and lock record
   * This also updates the appointment status to COMPLETED
   */
  async finalize(
    consultation: ConsultationRecord
  ): Promise<ConsultationRecord> {
    try {
      const response = await api.post(
        `/doctor/consultations/${consultation.appointmentId}/finalize`,
        consultation
      );
      return response.data;
    } catch (error) {
      console.error('Error finalizing consultation:', error);
      throw error;
    }
  }

  /**
   * Add amendment to finalized consultation
   */
  async addAmendment(
    appointmentId: number,
    content: string
  ): Promise<Amendment> {
    try {
      const response = await api.post(
        `/doctor/consultations/${appointmentId}/amendments`,
        { content }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding amendment:', error);
      throw error;
    }
  }

  /**
   * Sign/approve an amendment
   */
  async signAmendment(
    appointmentId: number,
    amendmentId: string
  ): Promise<Amendment> {
    try {
      const response = await api.post(
        `/doctor/consultations/${appointmentId}/amendments/${amendmentId}/sign`
      );
      return response.data;
    } catch (error) {
      console.error('Error signing amendment:', error);
      throw error;
    }
  }

  /**
   * Get all amendments for a consultation
   */
  async getAmendments(appointmentId: number): Promise<Amendment[]> {
    try {
      const response = await api.get(
        `/doctor/consultations/${appointmentId}/amendments`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching amendments:', error);
      throw error;
    }
  }

  /**
   * Print consultation summary (generates PDF)
   */
  async printSummary(appointmentId: number): Promise<Blob> {
    try {
      const response = await api.get(
        `/doctor/consultations/${appointmentId}/summary/print`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error printing summary:', error);
      throw error;
    }
  }

  /**
   * Upload attachment to consultation
   */
  async uploadAttachment(
    appointmentId: number,
    file: File
  ): Promise<{
    id: string;
    filename: string;
    type: string;
    uploadedAt: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/doctor/consultations/${appointmentId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Delete attachment from consultation
   */
  async deleteAttachment(
    appointmentId: number,
    attachmentId: string
  ): Promise<void> {
    try {
      await api.delete(
        `/doctor/consultations/${appointmentId}/attachments/${attachmentId}`
      );
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  }
}

export default new ConsultationService();
