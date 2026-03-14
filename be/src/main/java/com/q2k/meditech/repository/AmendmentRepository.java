package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Amendment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Amendment entity
 */
@Repository
public interface AmendmentRepository extends JpaRepository<Amendment, Long> {

    /**
     * Find all amendments for a consultation, ordered by creation date
     */
    @Query("SELECT a FROM Amendment a " +
           "WHERE a.consultation.id = :consultationId " +
           "ORDER BY a.createdAt DESC")
    List<Amendment> findByConsultationId(@Param("consultationId") Long consultationId);

    /**
     * Find unsigned amendments for a consultation
     */
    @Query("SELECT a FROM Amendment a " +
           "WHERE a.consultation.id = :consultationId " +
           "AND a.signedAt IS NULL " +
           "ORDER BY a.createdAt DESC")
    List<Amendment> findUnsignedByConsultationId(@Param("consultationId") Long consultationId);

    /**
     * Find amendments with null signed at for a consultation
     */
    @Query("SELECT a FROM Amendment a " +
           "WHERE a.consultation.id = :consultationId " +
           "AND a.signedAt IS NULL " +
           "ORDER BY a.createdAt DESC")
    List<Amendment> findByConsultationIdAndSignedAtNull(@Param("consultationId") Long consultationId);

    /**
     * Count signed amendments for a consultation
     */
    @Query("SELECT COUNT(a) FROM Amendment a " +
           "WHERE a.consultation.id = :consultationId " +
           "AND a.signedAt IS NOT NULL")
    long countSignedByConsultationId(@Param("consultationId") Long consultationId);
}
