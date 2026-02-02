package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TwoFactorBackup;
import com.q2k.meditech.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for TwoFactorBackup entity
 */
@Repository
public interface TwoFactorBackupRepository extends JpaRepository<TwoFactorBackup, Long> {

    /**
     * Find unused backup code by hash
     */
    @Query("SELECT tb FROM TwoFactorBackup tb WHERE tb.backupCodeHash = :hash " +
           "AND tb.usedAt IS NULL")
    Optional<TwoFactorBackup> findUnusedBackupCodeByHash(@Param("hash") String hash);

    /**
     * Find all unused backup codes for user
     */
    @Query("SELECT tb FROM TwoFactorBackup tb WHERE tb.user = :user " +
           "AND tb.usedAt IS NULL")
    List<TwoFactorBackup> findUnusedBackupCodesByUser(@Param("user") User user);

    /**
     * Count unused backup codes for user
     */
    @Query("SELECT COUNT(tb) FROM TwoFactorBackup tb WHERE tb.user = :user " +
           "AND tb.usedAt IS NULL")
    long countUnusedBackupCodesByUser(@Param("user") User user);

    /**
     * Delete all backup codes for user
     */
    void deleteByUser(User user);
}
