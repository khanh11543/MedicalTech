package com.q2k.meditech.repository;

import com.q2k.meditech.entity.EmailVerification;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for EmailVerification entity
 */
@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    /**
     * Find latest pending verification by email
     */
    @Query("SELECT ev FROM EmailVerification ev WHERE ev.email = :email " +
           "AND ev.status = :status ORDER BY ev.createdAt DESC")
    Optional<EmailVerification> findLatestByEmailAndStatus(
        @Param("email") String email,
        @Param("status") VerificationStatus status
    );

    /**
     * Find latest verification by user and email
     */
    Optional<EmailVerification> findTopByUserAndEmailOrderByCreatedAtDesc(User user, String email);

    /**
     * Find active verifications by user
     */
    @Query("SELECT ev FROM EmailVerification ev WHERE ev.user = :user " +
           "AND ev.status = 'PENDING' AND ev.expiresAt > :now")
    List<EmailVerification> findActiveVerificationsByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );

    /**
     * Delete expired verifications
     */
    void deleteByExpiresAtBeforeAndStatus(LocalDateTime expiryDate, VerificationStatus status);
}
