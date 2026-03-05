package com.q2k.meditech.repository;

import com.q2k.meditech.entity.PatientDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientDocumentRepository extends JpaRepository<PatientDocument, Long> {

    @Query("SELECT pd FROM PatientDocument pd " +
           "LEFT JOIN FETCH pd.uploadedBy " +
           "WHERE pd.patient.id = :patientId " +
           "ORDER BY pd.createdAt DESC")
    List<PatientDocument> findByPatientIdWithUploader(@Param("patientId") Long patientId);

    List<PatientDocument> findByPatientIdAndDocumentType(Long patientId, String documentType);

    Long countByPatientId(Long patientId);
}
