package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    /**
     * Find medical records by patient ID with date range and pagination
     */
    @Query("SELECT mr FROM MedicalRecord mr " +
            "WHERE mr.patient.id = :patientId " +
            "AND (:from IS NULL OR mr.visitDate >= :from) " +
            "AND (:to IS NULL OR mr.visitDate <= :to) " +
            "ORDER BY mr.visitDate DESC")
    Page<MedicalRecord> findByPatientIdWithDateRange(
            @Param("patientId") Long patientId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable
    );

    /**
     * Find medical record by ID and patient ID (for patient access check)
     */
    @Query("SELECT mr FROM MedicalRecord mr " +
            "WHERE mr.id = :id AND mr.patient.id = :patientId")
    Optional<MedicalRecord> findByIdAndPatientId(
            @Param("id") Long id,
            @Param("patientId") Long patientId
    );

    /**
     * Find medical record by ID and doctor ID (for doctor access check)
     */
    @Query("SELECT mr FROM MedicalRecord mr " +
            "WHERE mr.id = :id AND mr.doctor.id = :doctorId")
    Optional<MedicalRecord> findByIdAndDoctorId(
            @Param("id") Long id,
            @Param("doctorId") Long doctorId
    );

    /**
     * Find medical records by doctor ID with pagination
     */
    Page<MedicalRecord> findByDoctorIdOrderByVisitDateDesc(Long doctorId, Pageable pageable);

    /**
     * Check if record code already exists
     */
    boolean existsByRecordCode(String recordCode);

    /**
     * Count medical records for a patient
     */
    long countByPatientId(Long patientId);
}
