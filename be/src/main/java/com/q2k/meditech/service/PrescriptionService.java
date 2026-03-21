package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

public interface PrescriptionService {

    // ==================== PRESCRIPTION ====================

    /**
     * Create a new prescription
     * @param dto prescription information
     * @param doctorUserId user ID of the logged-in doctor
     */
    PrescriptionDTO createPrescription(PrescriptionCreateDTO dto, Long doctorUserId);

    /**
     * Get prescription by ID
     */
    PrescriptionDTO getPrescriptionById(Long id);

    /**
     * Get prescriptions for a patient
     */
    Page<PrescriptionDTO> getPatientPrescriptions(Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize);

    /**
     * Get prescriptions for a doctor
     */
    Page<PrescriptionDTO> getDoctorPrescriptions(Long doctorId, LocalDate from, LocalDate to, int pageNumber, int pageSize);

    // ==================== ADMIN METHODS ====================

    /**
     * Get all prescriptions for admin with advanced filters
     */
    Page<PrescriptionDTO> getAllPrescriptionsForAdmin(PrescriptionFilterDTO filter);

    /**
     * Get prescription statistics for admin dashboard
     */
    PrescriptionStatsDTO getPrescriptionStatistics(LocalDate from, LocalDate to);

    /**
     * Get detailed prescription information for admin
     */
    PrescriptionDetailDTO getPrescriptionDetailForAdmin(Long id);

    /**
     * Export prescriptions to Excel or CSV
     */
    Resource exportPrescriptions(PrescriptionFilterDTO filter, String format);

    /**
     * Generate prescription as PDF
     */
    Resource generatePrescriptionPdf(Long id);

    /**
     * Generate print-friendly prescription (HTML or PDF)
     */
    PrintTemplateDTO generatePrintTemplate(Long id, String format);

    /**
     * Send prescription to patient email with options
     */
    void sendPrescriptionEmail(Long id, SendPrescriptionEmailDTO emailRequest);

    // ==================== DOCTOR PRESCRIPTION LIFECYCLE ====================

    /**
     * Void (cancel) a prescription owned by the given doctor.
     * A void reason is required and will be appended to notes.
     */
    PrescriptionDTO voidPrescription(Long id, Long doctorUserId, String reason);

    /**
     * Reissue a prescription: creates a new ACTIVE copy of an existing prescription.
     * The original is not modified; the new prescription carries a reference to the original.
     */
    PrescriptionDTO reissuePrescription(Long id, Long doctorUserId);

    // ==================== PRESCRIPTION TEMPLATES (Doctor) ====================

    /**
     * Get all active templates belonging to the given doctor.
     */
    List<TemplateDTO> getDoctorTemplates(Long doctorUserId);

    /**
     * Get a single template by ID, scoped to the owning doctor.
     */
    TemplateDTO getTemplateById(Long id, Long doctorUserId);

    /**
     * Create a new personal prescription template for the given doctor.
     */
    TemplateDTO createTemplate(TemplateSaveDTO dto, Long doctorUserId);

    /**
     * Update an existing template (must belong to the given doctor).
     */
    TemplateDTO updateTemplate(Long id, TemplateSaveDTO dto, Long doctorUserId);

    /**
     * Soft-delete a template (must belong to the given doctor).
     */
    void deleteTemplate(Long id, Long doctorUserId);

    /**
     * Apply a template: increments its usage counter and returns its items
     * pre-mapped as PrescriptionItemDTO ready to be used in a new prescription.
     */
    List<PrescriptionItemDTO> applyTemplateItems(Long id, Long doctorUserId);
}