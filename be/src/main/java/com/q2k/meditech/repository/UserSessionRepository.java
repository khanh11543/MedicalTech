package com.q2k.meditech.repository;

import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for UserSession entity
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    /**
     * Find active session by session key
     */
    @Query("SELECT s FROM UserSession s WHERE s.sessionKey = :sessionKey " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now")
    Optional<UserSession> findActiveSessionByKey(
        @Param("sessionKey") String sessionKey,
        @Param("now") LocalDateTime now
    );

    /**
     * Find all active sessions for a user
     */
    @Query("SELECT s FROM UserSession s WHERE s.user = :user " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now " +
           "ORDER BY s.lastSeenAt DESC")
    List<UserSession> findActiveSessionsByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );

    /**
     * Find session by refresh token hash
     */
    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    /**
     * Revoke all active sessions for a user
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now, s.revokeReason = :reason " +
           "WHERE s.user = :user AND s.revokedAt IS NULL")
    void revokeAllUserSessions(
        @Param("user") User user,
        @Param("now") LocalDateTime now,
        @Param("reason") String reason
    );

    /**
     * Delete expired sessions
     */
    void deleteByExpiresAtBefore(LocalDateTime expiryDate);

    /**
     * Count active sessions for user
     */
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user = :user " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now")
    long countActiveSessionsByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );
}
