package com.q2k.meditech.repository;

import com.q2k.meditech.entity.LoginAttempt;
import com.q2k.meditech.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for LoginAttempt entity
 */
@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    /**
     * Count failed login attempts by email within time window
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.email = :email " +
           "AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByEmailSince(
        @Param("email") String email,
        @Param("since") LocalDateTime since
    );

    /**
     * Count failed login attempts by IP within time window
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress " +
           "AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByIpSince(
        @Param("ipAddress") String ipAddress,
        @Param("since") LocalDateTime since
    );

    /**
     * Find recent login attempts for user
     */
    @Query("SELECT la FROM LoginAttempt la WHERE la.user = :user " +
           "ORDER BY la.attemptedAt DESC")
    List<LoginAttempt> findRecentAttemptsByUser(
        @Param("user") User user,
        org.springframework.data.domain.Pageable pageable
    );

    /**
     * Find recent attempts by email
     */
    List<LoginAttempt> findByEmailOrderByAttemptedAtDesc(String email);

    /**
     * Delete old login attempts
     */
    void deleteByAttemptedAtBefore(LocalDateTime date);
}
