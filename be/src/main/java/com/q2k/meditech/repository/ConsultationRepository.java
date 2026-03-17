package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Consultation;
import com.q2k.meditech.entity.enums.ConsultationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Consultation entity
 */
@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    /**
     * Find consultation by appointment ID with eager loading
     * Note: Only fetch single-valued associations (doctor, finalizedByUser)
     * Collections (amendments, attachments) are lazy loaded to avoid MultipleBagFetchException
     */
    @Query("SELECT c FROM Consultation c " +
           "LEFT JOIN FETCH c.doctor d " +
           "LEFT JOIN FETCH d.user du " +
           "LEFT JOIN FETCH c.finalizedByUser " +
           "WHERE c.appointment.id = :appointmentId")
    Optional<Consultation> findByAppointmentIdWithDetails(@Param("appointmentId") Long appointmentId);

    /**
     * Find consultation by appointment ID
     */
    Optional<Consultation> findByAppointmentId(Long appointmentId);

    /**
     * Find all consultations for a doctor
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.doctor.id = :doctorId " +
           "ORDER BY c.createdAt DESC")
    List<Consultation> findByDoctorId(@Param("doctorId") Long doctorId);

    /**
     * Find all consultations for a patient
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.patient.id = :patientId " +
           "ORDER BY c.createdAt DESC")
    List<Consultation> findByPatientId(@Param("patientId") Long patientId);

    /**
     * Find finalized consultations for a patient between dates
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.patient.id = :patientId " +
           "AND c.isLocked = true " +
           "AND CAST(c.finalizedAt AS date) BETWEEN :startDate AND :endDate " +
           "ORDER BY c.finalizedAt DESC")
    List<Consultation> findFinalizedByPatientIdAndDateRange(
            @Param("patientId") Long patientId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Count draft consultations for a doctor
     */
    @Query("SELECT COUNT(c) FROM Consultation c " +
           "WHERE c.doctor.id = :doctorId " +
           "AND c.status = :status")
    long countDraftsByDoctorId(@Param("doctorId") Long doctorId, @Param("status") ConsultationStatus status);

    /**
     * Find all consultations for a doctor with pagination
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.doctor.id = :doctorId " +
           "ORDER BY c.createdAt DESC")
    Page<Consultation> findByDoctorId(@Param("doctorId") Long doctorId, Pageable pageable);

    /**
     * Find all consultations for a patient with pagination
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.patient.id = :patientId " +
           "ORDER BY c.createdAt DESC")
    Page<Consultation> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    /**
     * Find consultations by status with pagination
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.status = :status " +
           "ORDER BY c.createdAt DESC")
    Page<Consultation> findByStatus(@Param("status") ConsultationStatus status, Pageable pageable);

    /**
     * Find draft consultations for a doctor
     */
    @Query("SELECT c FROM Consultation c " +
           "WHERE c.doctor.id = :doctorId " +
           "AND c.status = :status " +
           "ORDER BY c.updatedAt DESC")
    List<Consultation> findByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") ConsultationStatus status);
}
