package com.q2k.meditech.service;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service interface for Backup operations (FR-BACK-001, 002, 003)
 */
public interface BackupService {

    // ==================== DASHBOARD (FR-BACK-001) ====================

    /**
     * Get backup dashboard info
     * @return Map containing: lastBackup, nextScheduled, health, storageInfo
     */
    Map<String, Object> getDashboard();

    // ==================== HISTORY (FR-BACK-002) ====================

    /**
     * Get backup history with pagination and filtering
     */
    Page<BackupRecord> getHistory(BackupType type, BackupStatus status,
                                   StorageLocation location,
                                   LocalDateTime startDate, LocalDateTime endDate,
                                   Pageable pageable);

    /**
     * Get backup detail by ID
     */
    BackupRecord getDetail(Long id);

    /**
     * Verify backup integrity (checksum)
     */
    Map<String, Object> verifyBackup(Long id);

    /**
     * Delete backup
     */
    void deleteBackup(Long id);

    /**
     * Download file backup
     */
    Resource downloadBackup(Long id);

    // ==================== MANUAL BACKUP (FR-BACK-003) ====================

    /**
     * Run manual backup
     * @param backupName Backup name
     * @param backupType Backup type
     * @param includes List of backup components ["DATABASE","FILES","CONFIG"]
     * @param storageLocation Storage location
     * @param encrypted Whether to encrypt
     * @return Created BackupRecord
     */
    BackupRecord runManualBackup(String backupName, BackupType backupType,
                                  List<String> includes, StorageLocation storageLocation,
                                  Boolean encrypted);

    /**
     * Get running backup progress
     */
    BackupRecord getBackupProgress(Long id);

    /**
     * Cancel running backup
     */
    void cancelBackup(Long id);

    // ==================== SCHEDULE ====================

    /**
     * Get all schedules
     */
    List<BackupSchedule> getSchedules();

    /**
     * Create new schedule
     */
    BackupSchedule createSchedule(BackupSchedule schedule);

    /**
     * Update schedule
     */
    BackupSchedule updateSchedule(Long id, BackupSchedule schedule);

    /**
     * Delete schedule
     */
    void deleteSchedule(Long id);

    /**
     * Enable/disable schedule
     */
    BackupSchedule toggleSchedule(Long id, boolean enabled);
}
