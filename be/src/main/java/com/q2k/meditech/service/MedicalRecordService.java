package com.q2k.meditech.service;

import com.q2k.meditech.dto.MedicalRecordCreateDTO;
import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.dto.MedicalRecordUpdateDTO;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

/**
 * Medical Record Service Interface
 */
public interface MedicalRecordService {

    /**
     * Create a new medical record (Doctor only)
     * 
     * @param doctorId the authenticated doctor's ID
     * @param createDTO the medical record data
     * @return the created medical record DTO
     */
    MedicalRecordDTO createMedicalRecord(Long doctorId, MedicalRecordCreateDTO createDTO);

    /**
     * Update a medical record (Doctor only - own records)
     * 
     * @param doctorId the authenticated doctor's ID
     * @param recordId the medical record ID to update
     * @param updateDTO the update data
     * @return the updated medical record DTO
     */
    MedicalRecordDTO updateMedicalRecord(Long doctorId, Long recordId, MedicalRecordUpdateDTO updateDTO);

    /**
     * Get patient's own medical records with pagination and date filter
     * 
     * @param patientId the authenticated patient's ID
     * @param from start date filter (optional)
     * @param to end date filter (optional)
     * @param pageNumber page number (0-based)
     * @param pageSize page size
     * @return paginated medical records
     */
    Page<MedicalRecordDTO> getPatientMedicalRecords(Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize);

    /**
     * Get medical record detail (Patient - own only)
     * 
     * @param patientId the authenticated patient's ID
     * @param recordId the medical record ID
     * @return the medical record DTO
     */
    MedicalRecordDTO getPatientRecordDetail(Long patientId, Long recordId);
}
