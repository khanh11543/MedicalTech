package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Doctor Patient Management
 * Provides APIs for doctors to manage their patient cohort
 */
public interface DoctorPatientManagementService {

    // ==================== MY PATIENTS TAB ====================

    /**
     * Get all patients of a doctor with search and pagination.
     * Returns only patients who have had appointments with this doctor or have upcoming appointments.
     *
     * @param doctorId Doctor ID
     * @param search Search query (name, email, phone)
     * @param pageable Pagination info
     * @return Page of DoctorPatientDTO
     */
    PageResponse<DoctorPatientDTO> getMyPatients(Long doctorId, String search, Pageable pageable);

    /**
     * Get detailed information for a specific patient including visit history and prescriptions.
     * Only accessible if doctor has seen this patient before.
     *
     * @param doctorId Doctor ID
     * @param patientId Patient ID
     * @return Detailed patient information
     */
    DoctorPatientDetailDTO getPatientDetail(Long doctorId, Long patientId);

    /**
     * Get paginated medical records (from finalized consultations) for a doctor-patient pair.
     *
     * @param doctorId Doctor ID
     * @param patientId Patient ID
     * @param pageable Pagination info
     * @return Page of medical record summaries
     */
    PageResponse<DoctorPatientDetailDTO.MedicalRecordSummaryDTO> getPatientMedicalRecords(
            Long doctorId,
            Long patientId,
            Pageable pageable);

    // ==================== RECENT TAB ====================

    /**
     * Get recently seen patients (last 30 days) for quick follow-up.
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientRecentDTO
     */
    PageResponse<DoctorPatientRecentDTO> getRecentPatients(Long doctorId, Pageable pageable);

    // ==================== FLAGS TAB ====================

    /**
     * Get patients with clinical flags (allergies or chronic conditions).
     * Used for clinical safety awareness.
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientFlagsDTO
     */
    PageResponse<DoctorPatientFlagsDTO> getPatientsWithFlags(Long doctorId, Pageable pageable);

    /**
     * Get patients with allergies only.
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientFlagsDTO
     */
    PageResponse<DoctorPatientFlagsDTO> getPatientsWithAllergies(Long doctorId, Pageable pageable);

    /**
     * Get patients with chronic conditions only.
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientFlagsDTO
     */
    PageResponse<DoctorPatientFlagsDTO> getPatientsWithChronicConditions(Long doctorId, Pageable pageable);

    /**
     * Get high-risk patients (severe allergies or multiple chronic conditions).
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientFlagsDTO
     */
    PageResponse<DoctorPatientFlagsDTO> getHighRiskPatients(Long doctorId, Pageable pageable);

    /**
     * Get patients with medication risk (polypharmacy: 2+ active prescriptions).
     *
     * @param doctorId Doctor ID
     * @param pageable Pagination info
     * @return Page of DoctorPatientFlagsDTO
     */
    PageResponse<DoctorPatientFlagsDTO> getPatientsWithMedicationRisk(Long doctorId, Pageable pageable);

    // ==================== STATISTICS ====================

    /**
     * Get statistics about doctor's patient cohort.
     *
     * @param doctorId Doctor ID
     * @return Statistics including total patients, with flags, recent, etc.
     */
    DoctorPatientCohortStatsDTO getPatientCohortStats(Long doctorId);
}
