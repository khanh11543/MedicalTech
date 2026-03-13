package com.q2k.meditech.repository;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long> {

    /**
     * Find latest completed backup
     */
    Optional<BackupRecord> findTopByStatusOrderByCompletedAtDesc(BackupStatus status);

    /**
     * Find backups by status
     */
    List<BackupRecord> findByStatusOrderByStartedAtDesc(BackupStatus status);

    /**
     * Find running backups
     */
    List<BackupRecord> findByStatus(BackupStatus status);

    /**
     * Filter backups by multiple criteria
     */
    @Query("SELECT b FROM BackupRecord b WHERE " +
            "(:type IS NULL OR b.backupType = :type) AND " +
            "(:status IS NULL OR b.status = :status) AND " +
            "(:location IS NULL OR b.storageLocation = :location) AND " +
            "(:startDate IS NULL OR b.startedAt >= :startDate) AND " +
            "(:endDate IS NULL OR b.startedAt <= :endDate) " +
            "ORDER BY b.startedAt DESC")
    Page<BackupRecord> findWithFilters(
            @Param("type") BackupType type,
            @Param("status") BackupStatus status,
            @Param("location") StorageLocation location,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Total backup storage size
     */
    @Query("SELECT COALESCE(SUM(b.size), 0) FROM BackupRecord b WHERE b.status = 'COMPLETED'")
    Long getTotalBackupSize();

    /**
     * Count backups by status
     */
    Long countByStatus(BackupStatus status);

    /**
     * Find backups older than specified date (for cleanup)
     */
    List<BackupRecord> findByCompletedAtBeforeAndStatus(LocalDateTime before, BackupStatus status);

    /**
     * Find backups by schedule ID
     */
    List<BackupRecord> findByScheduleIdOrderByStartedAtDesc(Long scheduleId);
}
