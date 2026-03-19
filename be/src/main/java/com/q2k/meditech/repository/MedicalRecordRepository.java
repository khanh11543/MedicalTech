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

    Long countByPatientId(Long patientId);

    @Query("SELECT COUNT(m) > 0 FROM MedicalRecord m WHERE m.patient.id = :patientId")
    boolean existsByPatientId(@Param("patientId") Long patientId);

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.doctor WHERE m.patient.id = :patientId",
           countQuery = "SELECT COUNT(m) FROM MedicalRecord m WHERE m.patient.id = :patientId")
    Page<MedicalRecord> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.doctor " +
           "WHERE m.patient.id = :patientId AND m.visitDate BETWEEN :from AND :to",
           countQuery = "SELECT COUNT(m) FROM MedicalRecord m WHERE m.patient.id = :patientId AND m.visitDate BETWEEN :from AND :to")
    Page<MedicalRecord> findByPatientIdAndDateRange(
            @Param("patientId") Long patientId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.doctor WHERE m.id = :id AND m.patient.id = :patientId")
    Optional<MedicalRecord> findByIdAndPatientId(@Param("id") Long id, @Param("patientId") Long patientId);

    @Query("SELECT m FROM MedicalRecord m WHERE m.appointment.id = :appointmentId")
    Optional<MedicalRecord> findByAppointmentId(@Param("appointmentId") Long appointmentId);

    // =========== Doctor-specific queries ===========

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.patient WHERE m.doctor.id = :doctorId",
           countQuery = "SELECT COUNT(m) FROM MedicalRecord m WHERE m.doctor.id = :doctorId")
    Page<MedicalRecord> findByDoctorId(@Param("doctorId") Long doctorId, Pageable pageable);

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.patient WHERE m.doctor.id = :doctorId AND m.visitDate BETWEEN :from AND :to",
           countQuery = "SELECT COUNT(m) FROM MedicalRecord m WHERE m.doctor.id = :doctorId AND m.visitDate BETWEEN :from AND :to")
    Page<MedicalRecord> findByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.patient WHERE m.id = :id AND m.doctor.id = :doctorId")
    Optional<MedicalRecord> findByIdAndDoctorId(@Param("id") Long id, @Param("doctorId") Long doctorId);

    @Query(value = "SELECT m FROM MedicalRecord m LEFT JOIN FETCH m.patient WHERE m.doctor.id = :doctorId AND m.patient.id = :patientId",
           countQuery = "SELECT COUNT(m) FROM MedicalRecord m WHERE m.doctor.id = :doctorId AND m.patient.id = :patientId")
    Page<MedicalRecord> findByDoctorIdAndPatientId(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            Pageable pageable);

    @Query("SELECT COUNT(m) FROM MedicalRecord m WHERE m.doctor.id = :doctorId")
    Long countByDoctorId(@Param("doctorId") Long doctorId);

    // =========== Patient-doctor cohort queries ===========

    /**
     * Get medical records for a doctor-patient pair as a list (for detail view)
     */
    @Query("SELECT m FROM MedicalRecord m WHERE m.doctor.id = :doctorId AND m.patient.id = :patientId ORDER BY m.visitDate DESC")
    java.util.List<MedicalRecord> findMedicalRecordsByDoctorIdAndPatientId(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId);
}
