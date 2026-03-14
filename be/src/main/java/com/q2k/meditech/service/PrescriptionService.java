package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

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
}