package com.q2k.meditech.service;

import com.q2k.meditech.dto.MedicalRecordDTO;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

/**
 * Service for Medical Record operations
 * Handles both patient and doctor access patterns
 */
public interface MedicalRecordService {

    // =========== DOCTOR APIs ===========

    /**
     * Get all medical records created by a doctor with pagination
     */
    Page<MedicalRecordDTO> getDoctorMedicalRecords(Long doctorId, int pageNumber, int pageSize, LocalDate from, LocalDate to);

    /**
     * Get medical records for a specific patient created by a doctor
     * Used when doctor views records for a patient they've treated
     */
    Page<MedicalRecordDTO> getDoctorPatientRecords(Long doctorId, Long patientId, int pageNumber, int pageSize);

    /**
     * Get a specific medical record created by a doctor
     * Verifies ownership by doctorId
     */
    MedicalRecordDTO getDoctorMedicalRecord(Long recordId, Long doctorId);

    // =========== PATIENT APIs ===========

    /**
     * Get all medical records for a patient with pagination
     */
    Page<MedicalRecordDTO> getPatientMedicalRecords(Long patientId, int pageNumber, int pageSize, LocalDate from, LocalDate to);

    /**
     * Get a specific medical record for a patient
     * Verifies ownership by patientId
     */
    MedicalRecordDTO getPatientMedicalRecord(Long recordId, Long patientId);

    /**
     * Check if patient has any medical records
     */
    boolean patientHasRecords(Long patientId);

    /**
     * Count medical records for a patient
     */
    Long countPatientRecords(Long patientId);

    /**
     * Get total medical records created by a doctor
     */
    Long countDoctorRecords(Long doctorId);

    /**
     * Get medical record by appointment ID (doctor access)
     * Returns null if no record exists for this appointment
     */
    MedicalRecordDTO getDoctorMedicalRecordByAppointmentId(Long appointmentId, Long doctorId);
}
