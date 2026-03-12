package com.q2k.meditech.service;

import com.q2k.meditech.dto.ConsultationDTO;
import com.q2k.meditech.dto.AmendmentDTO;
import com.q2k.meditech.dto.ConsultationAttachmentDTO;
import com.q2k.meditech.dto.ConsultationCreateUpdateDTO;
import com.q2k.meditech.entity.enums.ConsultationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Service interface for Consultation operations
 */
public interface ConsultationService {

    /**
     * Get consultation by ID
     */
    ConsultationDTO getConsultationById(Long consultationId);

    /**
     * Get consultation by appointment ID
     */
    ConsultationDTO getConsultationByAppointmentId(Long appointmentId);

    /**
     * Get consultation by doctor and date range with pagination
     */
    Page<ConsultationDTO> getDoctorConsultations(Long doctorId, Pageable pageable);

    /**
     * Get consultation by patient ID with pagination
     */
    Page<ConsultationDTO> getPatientConsultations(Long patientId, Pageable pageable);

    /**
     * Get draft consultations for a specific doctor
     */
    List<ConsultationDTO> getDraftConsultationsByDoctor(Long doctorId);

    /**
     * Create new consultation draft for an appointment
     */
    ConsultationDTO createConsultation(Long appointmentId, ConsultationCreateUpdateDTO dto);

    /**
     * Save consultation as draft (update existing draft)
     */
    ConsultationDTO updateConsultationDraft(Long appointmentId, ConsultationCreateUpdateDTO dto);

    /**
     * Finalize consultation - locks record and updates appointment status
     */
    ConsultationDTO finalizeConsultation(Long consultationId);

    /**
     * Finalize consultation with data - locks record and updates appointment status
     */
    ConsultationDTO finalizeConsultationWithData(Long appointmentId, ConsultationCreateUpdateDTO dto);

    /**
     * Add amendment to finalized consultation
     */
    AmendmentDTO addAmendment(Long consultationId, String content);

    /**
     * Add amendment to finalized consultation by appointment ID
     */
    AmendmentDTO addAmendmentByAppointmentId(Long appointmentId, String content);

    /**
     * Sign amendment - marks as reviewed and approved
     */
    AmendmentDTO signAmendment(Long amendmentId);

    /**
     * Sign amendment by appointment and amendment ID
     */
    AmendmentDTO signAmendment(Long appointmentId, String amendmentId);

    /**
     * Get all amendments for a consultation
     */
    List<AmendmentDTO> getAmendmentsByConsultationId(Long consultationId);

    /**
     * Get all amendments for an appointment
     */
    List<AmendmentDTO> getAmendmentsByAppointmentId(Long appointmentId);

    /**
     * Get unsigned amendments for a consultation (waiting for signature)
     */
    List<AmendmentDTO> getUnsignedAmendments(Long consultationId);

    /**
     * Upload attachment to consultation
     */
    ConsultationAttachmentDTO uploadAttachment(Long appointmentId, MultipartFile file) throws IOException;

    /**
     * Delete attachment from consultation
     */
    void deleteAttachment(Long attachmentId);

    /**
     * Get all attachments for a consultation
     */
    List<ConsultationAttachmentDTO> getAttachmentsByConsultationId(Long consultationId);

    /**
     * Delete consultation (hard delete - only for draft records)
     */
    void deleteConsultation(Long consultationId);

    /**
     * Get consultations by status
     */
    Page<ConsultationDTO> getConsultationsByStatus(ConsultationStatus status, Pageable pageable);
}
