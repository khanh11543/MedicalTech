package com.q2k.meditech.service;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.CommunicationLogDTO;
import com.q2k.meditech.dto.receptionist.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service for Receptionist Patient Management — Tab 3.
 * Handles patient listing, detail, search, demographic edits,
 * appointment history, clinical summary (count-only), documents,
 * communications, payment history, and statistics.
 */
public interface ReceptionistPatientService {

    // ==================== 3.1 ALL PATIENTS ====================

    /**
     * List all patients with pagination and filters.
     * Privacy-first: addresses NOT included, phone/email masked.
     */
    Page<PatientListDTO> listAllPatients(String search, String gender, Boolean isActive,
                                          Boolean hasInsurance, Pageable pageable);

    /**
     * Search patients by name, phone, or email (min 3 chars, DB-level query).
     */
    Page<PatientBasicDTO> searchPatients(String query, Pageable pageable);

    /**
     * Get full patient detail (triggers audit event "view patient profile").
     */
    PatientDetailDTO getPatientDetail(Long patientId, Long viewerUserId);

    /**
     * Update patient demographic info.
     * RESTRICTED: cannot edit fullName, DOB, gender, MRN (admin only).
     */
    PatientDetailDTO updateDemographic(Long patientId, UpdatePatientDemographicDTO dto, Long updaterUserId);

    /**
     * Soft-delete (deactivate) patient.
     */
    void deactivatePatient(Long patientId, Long deactivatedByUserId);

    /**
     * Reactivate patient.
     */
    void reactivatePatient(Long patientId, Long reactivatedByUserId);

    // ==================== 3.2 NEW PATIENTS (THIS MONTH) ====================

    /**
     * List new patients registered this month.
     */
    Page<NewPatientDTO> getNewPatients(Pageable pageable);

    // ==================== 3.3 FREQUENT PATIENTS ====================

    /**
     * List frequent patients (minVisits threshold).
     * @param minVisits  minimum completed visits
     * @param lapsedDays if set, only return patients whose last visit was >= lapsedDays ago
     * @param search     optional name/phone search within frequent patients
     */
    Page<FrequentPatientDTO> getFrequentPatients(Long minVisits, Long lapsedDays, String search, Pageable pageable);

    // ==================== PATIENT DETAIL TABS ====================

    /**
     * Get patient appointment history.
     */
    Page<AppointmentDTO> getPatientAppointments(Long patientId, Pageable pageable);

    /**
     * Get clinical summary — counts only, NO sensitive type info.
     */
    PatientClinicalSummaryDTO getClinicalSummary(Long patientId);

    /**
     * Get admin documents for a patient (ID/insurance/consent).
     */
    List<PatientDocumentDTO> getPatientDocuments(Long patientId);

    /**
     * Upload an admin document for a patient.
     */
    PatientDocumentDTO uploadDocument(Long patientId, MultipartFile file,
                                       UploadPatientDocumentDTO dto, Long uploaderUserId);

    /**
     * Get communication log for a patient.
     */
    Page<PatientCommunicationDTO> getCommunicationLog(Long patientId, Pageable pageable);

    /**
     * Send a template-based message (SMS/email) to a patient.
     */
    void sendMessage(Long patientId, SendTemplateMessageDTO dto, Long senderUserId);

    /**
     * Get payment history for a patient (read-only).
     */
    Page<PatientPaymentHistoryDTO> getPaymentHistory(Long patientId, Pageable pageable);

    /**
     * Download receipt PDF for a specific payment.
     */
    byte[] getReceiptPdf(Long patientId, Long paymentId);

    // ==================== STATISTICS ====================

    /**
     * Get patient statistics overview.
     */
    PatientStatsDTO getPatientStats();

    // ==================== TEMPLATES ====================

    /**
     * Get available message templates for receptionist.
     */
    List<NotificationTemplateDTO> getMessageTemplates();

    // ==================== QUICK BOOK ====================

    /**
     * Quick book appointment from patient detail page.
     */
    AppointmentDTO quickBookAppointment(Long patientId, QuickBookAppointmentDTO dto, Long bookerUserId);

    // ==================== CREATE PATIENT (REFACTORED) ====================

    /**
     * Create a new walk-in patient (moved from controller).
     */
    PatientBasicDTO createPatient(CreatePatientDTO dto);
}
