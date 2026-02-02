package com.q2k.meditech.repository;

import com.q2k.meditech.entity.RefreshToken;
import com.q2k.meditech.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for RefreshToken entity
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find active refresh token by token hash
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash " +
           "AND rt.revokedAt IS NULL AND rt.expiresAt > :now")
    Optional<RefreshToken> findActiveTokenByHash(
        @Param("tokenHash") String tokenHash,
        @Param("now") LocalDateTime now
    );

    /**
     * Find refresh token by hash (including revoked)
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Revoke all refresh tokens for a user
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now " +
           "WHERE rt.user = :user AND rt.revokedAt IS NULL")
    void revokeAllUserTokens(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );

    /**
     * Delete expired tokens
     */
    void deleteByExpiresAtBefore(LocalDateTime expiryDate);

    /**
     * Count active tokens for user
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user " +
           "AND rt.revokedAt IS NULL AND rt.expiresAt > :now")
    long countActiveTokensByUser(
        @Param("user") User user,
        @Param("now") LocalDateTime now
    );
}
