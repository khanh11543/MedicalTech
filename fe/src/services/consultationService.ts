import api from './api';

/**
 * Vitals data structure for medical consultation
 */
export interface VitalsDTO {
  temperature: number | null; // °C
  systolic: number | null; // mmHg - Systolic Blood Pressure
  diastolic: number | null; // mmHg - Diastolic Blood Pressure
  heartRate: number | null; // bpm
  respiratoryRate: number | null; // bpm
  height: number | null; // cm
  weight: number | null; // kg
  bmi: number | null; // calculated
}

/**
 * Consultation Attachment metadata
 */
export interface ConsultationAttachmentDTO {
  id: number;
  consultationId: number;
  filename: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedByUserName: string;
}

/**
 * Amendment/Addendum to finalized consultation
 *
 * When a consultation is finalized and locked, any changes must be made
 * via amendments. The consultation status will be updated to AMENDED.
 */
export interface Amendment {
  id: number;
  consultationId: number;
  content: string;
  createdByUserName: string;
  createdAt: string;
  signedByUserName?: string; // null if not yet signed
  signedAt?: string; // null if not yet signed
}

/**
 * Complete consultation record sent from backend
 *
 * Workflow states:
 * - DRAFT: Can be created, edited, and saved
 * - FINALIZED: Locked, cannot be directly edited
 * - AMENDED: Has amendments to the finalized record
 */
export interface ConsultationDTO {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;

  status: 'DRAFT' | 'FINALIZED' | 'AMENDED';

  // Chief medical information
  chiefComplaint: string;
  hpi: string;

  // Vitals (null if no vitals recorded yet)
  vitals: VitalsDTO | null;

  // Examination findings and diagnosis
  physicalExam: string;
  diagnosis: string;
  diagnosticCode: string;

  // Treatment and follow-up
  plan: string;
  followUpInstructions: string;

  // Record locking and finalization
  isLocked: boolean;
  finalizedAt?: string;
  finalizedByUserName?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Related records
  amendments: Amendment[];
  attachments: ConsultationAttachmentDTO[];
}

/**
 * DTO for creating/updating consultation data
 * Used for draft saves and finalization
 */
export interface ConsultationCreateUpdateDTO {
  appointmentId: number;
  chiefComplaint: string;
  hpi: string;
  temperature: number | null;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  height: number | null;
  weight: number | null;
  physicalExam: string;
  diagnosis: string;
  diagnosticCode: string;
  plan: string;
  followUpInstructions: string;
}

/**
 * Helper function to convert full consultation object to create/update payload
 */
function consultationToPayload(
  consultation: ConsultationDTO | Omit<ConsultationDTO, 'id'>,
  appointmentId: number
): ConsultationCreateUpdateDTO {
  const c = consultation as Record<string, unknown>;
  const vitals = c.vitals as Record<string, unknown> | undefined;
  return {
    appointmentId,
    chiefComplaint: (c.chiefComplaint as string) ?? '',
    hpi: (c.hpi as string) ?? '',
    temperature: (vitals?.temperature as number | null) ?? null,
    systolic: (vitals?.systolic as number | null) ?? null,
    diastolic: (vitals?.diastolic as number | null) ?? null,
    heartRate: (vitals?.heartRate as number | null) ?? null,
    respiratoryRate: (vitals?.respiratoryRate as number | null) ?? null,
    height: (vitals?.height as number | null) ?? null,
    weight: (vitals?.weight as number | null) ?? null,
    physicalExam: (c.physicalExam as string) ?? '',
    diagnosis: (c.diagnosis as string) ?? '',
    diagnosticCode: (c.diagnosticCode as string) ?? '',
    plan: (c.plan as string) ?? '',
    followUpInstructions: (c.followUpInstructions as string) ?? '',
  };
}

/**
 * Service for managing medical consultations
 *
 * Consultation Workflow:
 * 1. Doctor examines patient during appointment
 * 2. Creates/updates consultation as DRAFT (can save multiple times)
 * 3. When ready, finalizes consultation (status: FINALIZED, isLocked: true)
 * 4. Finalized consultations cannot be directly edited - must use amendments
 * 5. Amendments can be added to finalized consultations (status: AMENDED)
 * 6. Amendments must be signed by authorized personnel
 * 7. Attachments (medical documents, images, etc.) can be added at any time
 * 8. Consultation can be printed to PDF for records
 */
class ConsultationService {
  /**
   * Fetch all draft consultations for the current logged-in doctor
   *
   * @returns List of consultation records with DRAFT status
   */
  async getDraftConsultations(): Promise<ConsultationDTO[]> {
    try {
      const response = await api.get<ConsultationDTO[]>(
        `/doctor/consultations/drafts`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching draft consultations:', error);
      throw error;
    }
  }

  /**
   * Fetch an existing consultation record for an appointment
   *
   * Creates a new draft if consultation doesn't exist. Retrieves existing
   * consultation if it does (regardless of status: DRAFT, FINALIZED, or AMENDED).
   *
   * @param appointmentId - The appointment ID
   * @returns Consultation record (may be in any status)
   * @throws Error if appointment not found
   */
  async getConsultation(appointmentId: number): Promise<ConsultationDTO> {
    try {
      const response = await api.get<ConsultationDTO>(
        `/doctor/consultations/${appointmentId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      throw error;
    }
  }

  /**
   * Save consultation as draft
   *
   * This creates a new draft consultation if one doesn't exist, or updates an existing draft.
   * Finalized consultations cannot be updated with this - use amendments instead.
   *
   * @param appointmentIdOrConsultation - Appointment ID or full consultation data
   * @param consultationData - Consultation data (optional if first param is full DTO)
   * @returns Updated/created consultation (status: DRAFT)
   * @throws Error if trying to update a FINALIZED consultation
   */
  async saveDraft(
    appointmentIdOrConsultation:
      | number
      | ConsultationDTO
      | Omit<ConsultationDTO, 'id'>,
    consultationData?: Omit<ConsultationCreateUpdateDTO, 'appointmentId'>
  ): Promise<ConsultationDTO> {
    try {
      let appointmentId: number;
      let payload: ConsultationCreateUpdateDTO;

      // Handle both old signature (full object) and new signature (appointmentId + data)
      if (typeof appointmentIdOrConsultation === 'number') {
        appointmentId = appointmentIdOrConsultation;
        payload = {
          appointmentId,
          ...(consultationData || {}),
        } as ConsultationCreateUpdateDTO;
      } else {
        // Old style - full object passed
        const consultation = appointmentIdOrConsultation;
        appointmentId = (consultation as Record<string, unknown>)
          .appointmentId as number;
        payload = consultationToPayload(consultation, appointmentId);
      }

      const response = await api.post<ConsultationDTO>(
        `/doctor/consultations/${appointmentId}/draft`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Finalize consultation and lock record
   *
   * Finalizes the consultation record, making it locked and immutable.
   * Sets status to FINALIZED and locks the record (isLocked: true).
   * Also updates the associated appointment status to COMPLETED.
   *
   * Once finalized, the consultation cannot be directly edited. Any changes
   * must be made via amendments using addAmendment().
   *
   * @param appointmentIdOrConsultation - Appointment ID or full consultation data
   * @param consultationData - Consultation data (optional if first param is full DTO)
   * @returns Finalized consultation (status: FINALIZED, isLocked: true)
   * @throws Error if consultation does not exist or is not in DRAFT status
   */
  async finalize(
    appointmentIdOrConsultation:
      | number
      | ConsultationDTO
      | Omit<ConsultationDTO, 'id'>,
    consultationData?: Omit<ConsultationCreateUpdateDTO, 'appointmentId'>
  ): Promise<ConsultationDTO> {
    try {
      let appointmentId: number;
      let payload: ConsultationCreateUpdateDTO;

      // Handle both old signature (full object) and new signature (appointmentId + data)
      if (typeof appointmentIdOrConsultation === 'number') {
        appointmentId = appointmentIdOrConsultation;
        payload = {
          appointmentId,
          ...(consultationData || {}),
        } as ConsultationCreateUpdateDTO;
      } else {
        // Old style - full object passed
        const consultation = appointmentIdOrConsultation;
        appointmentId = (consultation as Record<string, unknown>)
          .appointmentId as number;
        payload = consultationToPayload(consultation, appointmentId);
      }

      const response = await api.post<ConsultationDTO>(
        `/doctor/consultations/${appointmentId}/finalize`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error finalizing consultation:', error);
      throw error;
    }
  }

  /**
   * Add amendment to finalized consultation
   *
   * Creates a new amendment/addendum to a FINALIZED consultation.
   * The consultation status will be updated to AMENDED.
   * Amendments are unsigned by default and must be signed separately.
   *
   * @param appointmentId - The appointment ID
   * @param content - Amendment text content
   * @returns Created amendment (unsigned)
   * @throws Error if consultation is not FINALIZED
   */
  async addAmendment(
    appointmentId: number,
    content: string
  ): Promise<Amendment> {
    try {
      const response = await api.post<Amendment>(
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
   *
   * Marks an amendment as reviewed and approved by the current user.
   * Sets signedAt timestamp and signedByUserName to current user.
   * Cannot be signed twice.
   *
   * @param appointmentId - The appointment ID
   * @param amendmentId - The amendment ID to sign
   * @returns Signed amendment (signedAt and signedByUserName populated)
   * @throws Error if amendment not found or already signed
   */
  async signAmendment(
    appointmentId: number,
    amendmentId: string | number
  ): Promise<Amendment> {
    try {
      const response = await api.post<Amendment>(
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
   *
   * Retrieves all amendments (signed and unsigned) for a consultation,
   * ordered by creation date (newest first).
   *
   * @param appointmentId - The appointment ID
   * @returns List of amendments
   */
  async getAmendments(appointmentId: number): Promise<Amendment[]> {
    try {
      const response = await api.get<Amendment[]>(
        `/doctor/consultations/${appointmentId}/amendments`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching amendments:', error);
      throw error;
    }
  }

  /**
   * Print consultation summary as PDF
   *
   * Generates and returns a PDF document containing the consultation summary.
   * Can be used for printing, archiving, or patient records.
   *
   * @param appointmentId - The appointment ID
   * @returns PDF file as Blob
   */
  async printSummary(appointmentId: number): Promise<Blob> {
    try {
      const response = await api.get<Blob>(
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
   *
   * Adds a file attachment to a consultation (at any status: DRAFT, FINALIZED, or AMENDED).
   * Supported file types include medical documents, images, test results, etc.
   * Uploaded by the current user.
   *
   * @param appointmentId - The appointment ID
   * @param file - File to upload
   * @returns Attachment metadata
   * @throws Error if file exceeds size limit or unsupported type
   */
  async uploadAttachment(
    appointmentId: number,
    file: File
  ): Promise<ConsultationAttachmentDTO> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ConsultationAttachmentDTO>(
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
   *
   * Removes an attachment from a consultation. The attachment file is
   * deleted from storage and the database record is removed.
   *
   * @param appointmentId - The appointment ID (for context)
   * @param attachmentId - The attachment ID to delete
   */
  async deleteAttachment(
    appointmentId: number,
    attachmentId: number | string
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

  /**
   * Helper: Check if consultation can be edited
   *
   * A consultation can only be directly edited if it's in DRAFT status.
   * Finalized consultations must use amendments.
   *
   * @param consultation - The consultation to check
   * @returns true if consultation is in DRAFT status
   */
  isEditable(consultation: ConsultationDTO): boolean {
    return consultation.status === 'DRAFT' && !consultation.isLocked;
  }

  /**
   * Helper: Check if consultation has been locked/finalized
   *
   * @param consultation - The consultation to check
   * @returns true if consultation is finalized and locked
   */
  isFinalized(consultation: ConsultationDTO): boolean {
    return consultation.status === 'FINALIZED' && consultation.isLocked;
  }

  /**
   * Helper: Check if amendments are pending signature
   *
   * @param consultation - The consultation to check
   * @returns true if there are unsigned amendments
   */
  hasUnsignedAmendments(consultation: ConsultationDTO): boolean {
    return consultation.amendments.some((amendment) => !amendment.signedAt);
  }
}

/**
 * Type alias for backward compatibility
 * Use ConsultationDTO in new code
 */
export type ConsultationRecord = ConsultationDTO;

export default new ConsultationService();
