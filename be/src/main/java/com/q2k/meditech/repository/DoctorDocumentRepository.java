package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DoctorDocument;
import com.q2k.meditech.entity.enums.DoctorDocumentType;
import com.q2k.meditech.entity.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorDocumentRepository extends JpaRepository<DoctorDocument, Long> {

    /**
     * Find all documents for a doctor
     */
    List<DoctorDocument> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    /**
     * Find documents for a doctor filtered by status
     */
    List<DoctorDocument> findByDoctorIdAndStatusOrderByCreatedAtDesc(Long doctorId, ReviewStatus status);

    /**
     * Find documents for a doctor filtered by type
     */
    List<DoctorDocument> findByDoctorIdAndDocTypeOrderByCreatedAtDesc(Long doctorId, DoctorDocumentType docType);

    /**
     * Find documents for a doctor filtered by status and type
     */
    List<DoctorDocument> findByDoctorIdAndStatusAndDocTypeOrderByCreatedAtDesc(
            Long doctorId, ReviewStatus status, DoctorDocumentType docType);

    /**
     * Find document by ID with doctor info
     */
    @Query("SELECT dd FROM DoctorDocument dd " +
            "JOIN FETCH dd.doctor d " +
            "LEFT JOIN FETCH d.user u " +
            "WHERE dd.id = :id")
    Optional<DoctorDocument> findByIdWithDoctor(@Param("id") Long id);

    /**
     * Find all documents by status (for admin)
     */
    Page<DoctorDocument> findByStatusOrderByCreatedAtAsc(ReviewStatus status, Pageable pageable);

    /**
     * Find all documents with filters (for admin)
     */
    @Query("SELECT dd FROM DoctorDocument dd " +
            "JOIN FETCH dd.doctor d " +
            "LEFT JOIN FETCH d.user u " +
            "LEFT JOIN FETCH dd.reviewedBy " +
            "WHERE (:status IS NULL OR dd.status = :status) " +
            "AND (:docType IS NULL OR dd.docType = :docType) " +
            "ORDER BY dd.createdAt ASC")
    List<DoctorDocument> findAllWithFilters(
            @Param("status") ReviewStatus status,
            @Param("docType") DoctorDocumentType docType);

    /**
     * Find pending documents (for admin dashboard)
     */
    @Query("SELECT dd FROM DoctorDocument dd " +
            "JOIN FETCH dd.doctor d " +
            "LEFT JOIN FETCH d.user u " +
            "WHERE dd.status = 'PENDING' " +
            "ORDER BY dd.createdAt ASC")
    Page<DoctorDocument> findPendingDocuments(Pageable pageable);

    /**
     * Count documents by status
     */
    long countByStatus(ReviewStatus status);

    /**
     * Count documents by doctor and status
     */
    long countByDoctorIdAndStatus(Long doctorId, ReviewStatus status);

    /**
     * Check if doctor has a specific document type
     */
    boolean existsByDoctorIdAndDocType(Long doctorId, DoctorDocumentType docType);

    /**
     * Check if doctor has an approved document of specific type
     */
    @Query("SELECT COUNT(dd) > 0 FROM DoctorDocument dd " +
            "WHERE dd.doctor.id = :doctorId " +
            "AND dd.docType = :docType " +
            "AND dd.status = 'APPROVED'")
    boolean hasApprovedDocument(@Param("doctorId") Long doctorId, @Param("docType") DoctorDocumentType docType);

    /**
     * Find latest document of each type for a doctor
     */
    @Query("SELECT dd FROM DoctorDocument dd " +
            "WHERE dd.doctor.id = :doctorId " +
            "AND dd.createdAt = (" +
            "  SELECT MAX(dd2.createdAt) FROM DoctorDocument dd2 " +
            "  WHERE dd2.doctor.id = dd.doctor.id AND dd2.docType = dd.docType" +
            ")")
    List<DoctorDocument> findLatestByDoctorId(@Param("doctorId") Long doctorId);
}