package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT mr FROM MedicalRecord mr " +
           "LEFT JOIN FETCH mr.doctor d " +
           "LEFT JOIN FETCH d.user " +
           "WHERE mr.patient.id = :patientId " +
           "ORDER BY mr.visitDate DESC")
    List<MedicalRecord> findByPatientIdOrderByVisitDateDesc(@Param("patientId") Long patientId);

    @Query("SELECT mr FROM MedicalRecord mr " +
           "LEFT JOIN FETCH mr.doctor d " +
           "LEFT JOIN FETCH d.user " +
           "WHERE mr.patient.id = :patientId")
    Page<MedicalRecord> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query("SELECT mr FROM MedicalRecord mr " +
           "LEFT JOIN FETCH mr.doctor d " +
           "LEFT JOIN FETCH d.user " +
           "LEFT JOIN FETCH mr.appointment " +
           "WHERE mr.id = :id AND mr.patient.id = :patientId")
    Optional<MedicalRecord> findByIdAndPatientId(@Param("id") Long id, @Param("patientId") Long patientId);

    @Query("SELECT mr FROM MedicalRecord mr " +
           "WHERE mr.patient.id = :patientId " +
           "AND mr.visitDate BETWEEN :fromDate AND :toDate " +
           "ORDER BY mr.visitDate DESC")
    Page<MedicalRecord> findByPatientIdAndDateRange(
            @Param("patientId") Long patientId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    long countByPatientId(Long patientId);
}
