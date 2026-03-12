package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ConsultationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ConsultationAttachment entity
 */
@Repository
public interface ConsultationAttachmentRepository extends JpaRepository<ConsultationAttachment, Long> {

    /**
     * Find all attachments for a consultation
     */
    @Query("SELECT ca FROM ConsultationAttachment ca " +
           "WHERE ca.consultation.id = :consultationId " +
           "ORDER BY ca.createdAt DESC")
    List<ConsultationAttachment> findByConsultationId(@Param("consultationId") Long consultationId);

    /**
     * Find attachments by file type for a consultation
     */
    @Query("SELECT ca FROM ConsultationAttachment ca " +
           "WHERE ca.consultation.id = :consultationId " +
           "AND ca.fileType = :fileType")
    List<ConsultationAttachment> findByConsultationIdAndFileType(
            @Param("consultationId") Long consultationId,
            @Param("fileType") String fileType
    );

    /**
     * Count attachments for a consultation
     */
    @Query("SELECT COUNT(ca) FROM ConsultationAttachment ca " +
           "WHERE ca.consultation.id = :consultationId")
    long countByConsultationId(@Param("consultationId") Long consultationId);
}
