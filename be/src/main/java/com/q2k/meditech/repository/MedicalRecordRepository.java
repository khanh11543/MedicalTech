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

    Page<MedicalRecord> findByPatientId(Long patientId, Pageable pageable);

    @Query("SELECT m FROM MedicalRecord m WHERE m.patient.id = :patientId " +
           "AND m.visitDate BETWEEN :from AND :to")
    Page<MedicalRecord> findByPatientIdAndDateRange(
            @Param("patientId") Long patientId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    Optional<MedicalRecord> findByIdAndPatientId(Long id, Long patientId);
}
