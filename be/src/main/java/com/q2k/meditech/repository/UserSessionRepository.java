package com.q2k.meditech.repository;

import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserSession;
import com.q2k.meditech.entity.enums.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
public interface UserSessionRepository extends JpaRepository<UserSession, Long>,
        JpaSpecificationExecutor<UserSession> {

    // ===== Existing methods =====

    @Query("SELECT s FROM UserSession s WHERE s.sessionKey = :sessionKey " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now")
    Optional<UserSession> findActiveSessionByKey(
        @Param("sessionKey") String sessionKey,
        @Param("now") LocalDateTime now
    );

    @Query("SELECT s FROM UserSession s WHERE s.user = :user " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now " +
           "ORDER BY s.lastSeenAt DESC")
    List<UserSession> findActiveSessionsByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );

    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now, s.revokeReason = :reason " +
           "WHERE s.user = :user AND s.revokedAt IS NULL")
    void revokeAllUserSessions(
        @Param("user") User user,
        @Param("now") LocalDateTime now,
        @Param("reason") String reason
    );

    void deleteByExpiresAtBefore(LocalDateTime expiryDate);

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.user = :user " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now")
    long countActiveSessionsByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );

    // ===== Status-based queries =====

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.status = :status")
    long countByStatus(@Param("status") SessionStatus status);

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.status = :status " +
           "AND s.revokedAt >= :since")
    long countByStatusSince(@Param("status") SessionStatus status, @Param("since") LocalDateTime since);

    Page<UserSession> findByStatusOrderByLastSeenAtDesc(SessionStatus status, Pageable pageable);

    @Query("SELECT s FROM UserSession s WHERE s.status = 'ACTIVE' " +
           "AND s.lastSeenAt < :threshold AND s.revokedAt IS NULL " +
           "ORDER BY s.lastSeenAt ASC")
    List<UserSession> findIdleSessions(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.status = 'ACTIVE' " +
           "AND s.lastSeenAt < :threshold AND s.revokedAt IS NULL")
    long countIdleSessions(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT s FROM UserSession s WHERE s.status = 'ACTIVE' " +
           "AND s.lastSeenAt < :threshold AND s.revokedAt IS NULL")
    Page<UserSession> findIdleSessions(@Param("threshold") LocalDateTime threshold, Pageable pageable);

    // ===== IP-based queries =====

    List<UserSession> findByIpAddressOrderByLastSeenAtDesc(String ipAddress);

    Page<UserSession> findByIpAddressOrderByLastSeenAtDesc(String ipAddress, Pageable pageable);

    @Query("SELECT DISTINCT s.ipAddress FROM UserSession s WHERE s.user.id = :userId " +
           "AND s.revokedAt IS NULL AND s.expiresAt > :now")
    List<String> findActiveIpsByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now);

    // ===== Statistics queries =====

    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.revokedAt IS NULL " +
           "AND s.expiresAt > :now")
    long countTotalActiveSessions(@Param("now") LocalDateTime now);

    @Query("SELECT s.deviceType, COUNT(s) FROM UserSession s " +
           "WHERE s.revokedAt IS NULL AND s.expiresAt > :now " +
           "GROUP BY s.deviceType ORDER BY COUNT(s) DESC")
    List<Object[]> countActiveByDeviceType(@Param("now") LocalDateTime now);

    @Query("SELECT s.browserName, COUNT(s) FROM UserSession s " +
           "WHERE s.revokedAt IS NULL AND s.expiresAt > :now " +
           "GROUP BY s.browserName ORDER BY COUNT(s) DESC")
    List<Object[]> countActiveByBrowser(@Param("now") LocalDateTime now);

    @Query("SELECT s.geoCountry, COUNT(s) FROM UserSession s " +
           "WHERE s.revokedAt IS NULL AND s.expiresAt > :now " +
           "GROUP BY s.geoCountry ORDER BY COUNT(s) DESC")
    List<Object[]> countActiveByCountry(@Param("now") LocalDateTime now);

    @Query("SELECT FUNCTION('DATE', s.createdAt), COUNT(s) FROM UserSession s " +
           "WHERE s.createdAt BETWEEN :from AND :to " +
           "GROUP BY FUNCTION('DATE', s.createdAt) ORDER BY FUNCTION('DATE', s.createdAt)")
    List<Object[]> countSessionsByDateGrouped(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ===== Force-logout / bulk revoke =====

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now, s.revokeReason = :reason, " +
           "s.status = 'REVOKED' WHERE s.ipAddress = :ipAddress AND s.revokedAt IS NULL")
    int revokeAllSessionsByIp(
            @Param("ipAddress") String ipAddress,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now, s.revokeReason = :reason, " +
           "s.status = 'REVOKED' WHERE s.user.id = :userId AND s.revokedAt IS NULL " +
           "AND s.id <> :excludeSessionId")
    int revokeOtherUserSessions(
            @Param("userId") Long userId,
            @Param("excludeSessionId") Long excludeSessionId,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    // ===== User session lookup =====

    @Query("SELECT s FROM UserSession s WHERE s.user.id = :userId " +
           "ORDER BY s.lastSeenAt DESC")
    Page<UserSession> findByUserIdOrderByLastSeenAtDesc(
            @Param("userId") Long userId, Pageable pageable);
}
