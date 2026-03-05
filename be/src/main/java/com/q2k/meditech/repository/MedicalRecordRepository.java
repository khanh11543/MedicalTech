package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Long countByPatientId(Long patientId);

    @Query("SELECT COUNT(m) > 0 FROM MedicalRecord m WHERE m.patient.id = :patientId")
    boolean existsByPatientId(@Param("patientId") Long patientId);
}
