package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for Prescription Template Analytics and Statistics
 */
public interface PrescriptionTemplateService {

    /**
     * Get overall template usage statistics
     */
    TemplateStatsDTO getTemplateStatistics(LocalDate from, LocalDate to);

    /**
     * Get template usage breakdown by doctor
     */
    List<DoctorTemplateStatsDTO> getTemplatesByDoctor(LocalDate from, LocalDate to, int top);

    /**
     * Get most commonly prescribed medications
     */
    List<CommonMedicationDTO> getCommonMedications(LocalDate from, LocalDate to, int top, String groupBy);

    /**
     * Get template usage trends over time
     */
    TemplateUsageTrendsDTO getUsageTrends(LocalDate from, LocalDate to, String groupBy, Long doctorId);

    // ==================== DOCTOR TEMPLATE CRUD ====================

    TemplateDTO createTemplate(TemplateCreateDTO dto, Long doctorUserId);

    List<TemplateDTO> getDoctorTemplates(Long doctorUserId, Boolean activeOnly);

    TemplateDTO getTemplateById(Long id, Long doctorUserId);

    TemplateDTO updateTemplate(Long id, TemplateUpdateDTO dto, Long doctorUserId);

    void deleteTemplate(Long id, Long doctorUserId);

    PrescriptionDTO applyTemplate(Long id, ApplyTemplateDTO dto, Long doctorUserId);
}
