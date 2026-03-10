package com.q2k.meditech.service;

import com.q2k.meditech.config.BackupProperties;
import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import com.q2k.meditech.entity.enums.StorageLocation;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.BackupScheduleRepository;
import com.q2k.meditech.repository.MaintenanceWindowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Backup Scheduler Service
 * Handles scheduled tasks for backup automation and maintenance lifecycle
 *
 * Tasks:
 * 1. Execute scheduled backups based on BackupSchedule cron
 * 2. Clean up old backups past retention period
 * 3. Auto-activate/deactivate maintenance windows
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BackupSchedulerService {

    private final BackupService backupService;
    private final BackupScheduleRepository scheduleRepository;
    private final BackupRecordRepository backupRecordRepository;
    private final MaintenanceWindowRepository maintenanceWindowRepository;
    private final BackupProperties backupProperties;

    // ==================== SCHEDULED BACKUP EXECUTION ====================

    /**
     * Check and execute scheduled backups every minute
     * Looks for enabled schedules where nextRunAt <= now
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    @Transactional
    public void executeScheduledBackups() {
        if (!backupProperties.getSchedule().isEnabled()) {
            return;
        }

        List<BackupSchedule> dueSchedules = scheduleRepository
                .findByEnabledTrueAndNextRunAtBefore(LocalDateTime.now());

        if (dueSchedules.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled backups due for execution", dueSchedules.size());

        for (BackupSchedule schedule : dueSchedules) {
            try {
                executeScheduledBackup(schedule);
            } catch (Exception e) {
                log.error("Failed to execute scheduled backup: {} - {}", schedule.getName(), e.getMessage(), e);
            }
        }
    }

    /**
     * Execute a single scheduled backup
     */
    private void executeScheduledBackup(BackupSchedule schedule) {
        log.info("Executing scheduled backup: {} (type: {}, cron: {})",
                schedule.getName(), schedule.getBackupType(), schedule.getCronExpression());

        // Generate backup name with timestamp
        String backupName = String.format("scheduled_%s_%s",
                schedule.getName().replaceAll("\\s+", "_").toLowerCase(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));

        // Determine includes - default to DATABASE if not set
        List<String> includes = schedule.getIncludes() != null
                ? List.of(schedule.getIncludes().split(","))
                : List.of("DATABASE");

        // Run the backup
        BackupRecord record = backupService.runManualBackup(
                backupName,
                schedule.getBackupType() != null ? schedule.getBackupType() : BackupType.FULL,
                includes,
                schedule.getStorageLocation() != null ? schedule.getStorageLocation() : StorageLocation.LOCAL,
                schedule.getEncrypted() != null ? schedule.getEncrypted() : false
        );

        // Update schedule with last run and calculate next run
        schedule.setLastRunAt(LocalDateTime.now());
        schedule.setNextRunAt(calculateNextRun(schedule.getCronExpression()));
        scheduleRepository.save(schedule);

        log.info("Scheduled backup started: {} (backup ID: {})", schedule.getName(), record.getId());

        // Clean up old backups for this schedule if max backups exceeded
        cleanupExcessBackups(schedule);
    }

    // ==================== BACKUP CLEANUP ====================

    /**
     * Clean up old backups past retention period
     * Runs every Sunday at 3 AM (configurable)
     */
    @Scheduled(cron = "${app.backup.schedule.cleanup-cron:0 0 3 * * SUN}")
    @Transactional
    public void cleanupOldBackups() {
        int retentionDays = backupProperties.getMaxRetentionDays();
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);

        log.info("Running backup cleanup - removing backups older than {} days (before {})",
                retentionDays, cutoffDate);

        List<BackupRecord> oldBackups = backupRecordRepository
                .findByCompletedAtBeforeAndStatus(cutoffDate, BackupStatus.COMPLETED);

        if (oldBackups.isEmpty()) {
            log.info("No old backups to clean up");
            return;
        }

        int deletedCount = 0;
        for (BackupRecord backup : oldBackups) {
            try {
                backupService.deleteBackup(backup.getId());
                deletedCount++;
            } catch (Exception e) {
                log.error("Failed to delete old backup: {} (ID: {}) - {}",
                        backup.getBackupName(), backup.getId(), e.getMessage());
            }
        }

        log.info("Backup cleanup completed: {}/{} old backups deleted", deletedCount, oldBackups.size());
    }

    /**
     * Clean up excess backups for a schedule (keep only maxBackups most recent)
     */
    private void cleanupExcessBackups(BackupSchedule schedule) {
        if (schedule.getMaxBackups() == null || schedule.getMaxBackups() <= 0) {
            return;
        }

        List<BackupRecord> scheduleBackups = backupRecordRepository
                .findByScheduleIdOrderByStartedAtDesc(schedule.getId());

        if (scheduleBackups.size() <= schedule.getMaxBackups()) {
            return;
        }

        // Delete excess backups (oldest first)
        List<BackupRecord> toDelete = scheduleBackups.subList(
                schedule.getMaxBackups(), scheduleBackups.size());

        log.info("Cleaning up {} excess backups for schedule: {}", toDelete.size(), schedule.getName());

        for (BackupRecord backup : toDelete) {
            try {
                if (backup.getStatus() == BackupStatus.COMPLETED) {
                    backupService.deleteBackup(backup.getId());
                }
            } catch (Exception e) {
                log.error("Failed to delete excess backup ID: {} - {}", backup.getId(), e.getMessage());
            }
        }
    }

    // ==================== MAINTENANCE WINDOW LIFECYCLE ====================

    /**
     * Check and auto-activate/deactivate maintenance windows
     * Runs every minute
     */
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    @Transactional
    public void manageMaintainanceWindows() {
        // Auto-activate scheduled maintenance windows that are due
        activateReadyMaintenanceWindows();

        // Auto-deactivate expired maintenance windows
        deactivateExpiredMaintenanceWindows();
    }

    /**
     * Activate maintenance windows whose startTime has passed
     */
    private void activateReadyMaintenanceWindows() {
        List<MaintenanceWindow> readyWindows = maintenanceWindowRepository.findReadyToActivate(LocalDateTime.now());

        for (MaintenanceWindow window : readyWindows) {
            log.info("Auto-activating maintenance window: {} (ID: {})", window.getTitle(), window.getId());
            window.setStatus(MaintenanceStatus.ACTIVE);
            window.setActualStartTime(LocalDateTime.now());
            maintenanceWindowRepository.save(window);
        }
    }

    /**
     * Deactivate maintenance windows whose endTime has passed
     */
    private void deactivateExpiredMaintenanceWindows() {
        List<MaintenanceWindow> expiredWindows = maintenanceWindowRepository.findExpiredActive(LocalDateTime.now());

        for (MaintenanceWindow window : expiredWindows) {
            log.info("Auto-deactivating expired maintenance window: {} (ID: {})",
                    window.getTitle(), window.getId());
            window.setStatus(MaintenanceStatus.COMPLETED);
            window.setActualEndTime(LocalDateTime.now());
            maintenanceWindowRepository.save(window);
        }
    }

    // ==================== HELPERS ====================

    /**
     * Calculate next run time from cron expression
     * Simple implementation - calculates common scenarios
     */
    private LocalDateTime calculateNextRun(String cronExpression) {
        // For simplicity, calculate next run based on common patterns
        // In production, use a cron parser library like cron-utils
        try {
            String[] parts = cronExpression.split("\\s+");
            if (parts.length >= 6) {
                int seconds = parseField(parts[0], 0);
                int minutes = parseField(parts[1], 0);
                int hours = parseField(parts[2], 0);

                // Default: schedule for next day at the specified time
                LocalDateTime next = LocalDateTime.now()
                        .plusDays(1)
                        .withHour(hours)
                        .withMinute(minutes)
                        .withSecond(seconds)
                        .withNano(0);

                return next;
            }
        } catch (Exception e) {
            log.warn("Failed to parse cron expression: {} - defaulting to 24h from now", cronExpression);
        }

        // Fallback: 24 hours from now
        return LocalDateTime.now().plusHours(24);
    }

    /**
     * Parse a single cron field, returning default if wildcard or unparseable
     */
    private int parseField(String field, int defaultValue) {
        if ("*".equals(field) || "?".equals(field)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(field);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
