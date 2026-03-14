package com.q2k.meditech.service;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.BackupScheduleRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BackupServiceImpl implements BackupService {

    private final BackupRecordRepository backupRecordRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final UserRepository userRepository;
    private final DatabaseService databaseService;
    private final NotificationEventService notificationEventService;

    @Value("${app.backup.storage-path:./backups}")
    private String storagePath;

    @Value("${app.backup.max-retention-days:90}")
    private int maxRetentionDays;

    // ==================== DASHBOARD (FR-BACK-001) ====================

    @Override
    public Map<String, Object> getDashboard() {
        log.info("Getting backup dashboard");
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // Last backup
        BackupRecord lastBackup = backupRecordRepository
                .findTopByStatusOrderByCompletedAtDesc(BackupStatus.COMPLETED)
                .orElse(null);
        dashboard.put("lastBackup", lastBackup);

        // Next scheduled
        List<BackupSchedule> enabledSchedules = backupScheduleRepository.findByEnabledTrue();
        BackupSchedule nextScheduled = enabledSchedules.stream()
                .filter(s -> s.getNextRunAt() != null)
                .min(Comparator.comparing(BackupSchedule::getNextRunAt))
                .orElse(null);
        dashboard.put("nextScheduled", nextScheduled);

        // Health status
        Map<String, Object> health = new LinkedHashMap<>();
        long completedCount = backupRecordRepository.countByStatus(BackupStatus.COMPLETED);
        long failedCount = backupRecordRepository.countByStatus(BackupStatus.FAILED);
        long inProgressCount = backupRecordRepository.countByStatus(BackupStatus.IN_PROGRESS);
        health.put("completedCount", completedCount);
        health.put("failedCount", failedCount);
        health.put("inProgressCount", inProgressCount);
        health.put("status", failedCount == 0 && lastBackup != null ? "HEALTHY" : (failedCount > 0 ? "WARNING" : "NO_BACKUP"));
        dashboard.put("health", health);

        // Storage info
        Map<String, Object> storageInfo = new LinkedHashMap<>();
        Long totalBackupSize = backupRecordRepository.getTotalBackupSize();
        storageInfo.put("totalBackupSize", totalBackupSize);
        storageInfo.put("storagePath", storagePath);
        try {
            File storageDir = new File(storagePath);
            if (storageDir.exists()) {
                storageInfo.put("totalSpace", storageDir.getTotalSpace());
                storageInfo.put("freeSpace", storageDir.getFreeSpace());
                storageInfo.put("usableSpace", storageDir.getUsableSpace());
            }
        } catch (Exception e) {
            log.warn("Cannot get storage info: {}", e.getMessage());
        }
        dashboard.put("storageInfo", storageInfo);

        return dashboard;
    }

    // ==================== HISTORY (FR-BACK-002) ====================

    @Override
    public Page<BackupRecord> getHistory(BackupType type, BackupStatus status,
                                          StorageLocation location,
                                          LocalDateTime startDate, LocalDateTime endDate,
                                          Pageable pageable) {
        log.info("Getting backup history with filters - type: {}, status: {}, location: {}", type, status, location);
        return backupRecordRepository.findWithFilters(type, status, location, startDate, endDate, pageable);
    }

    @Override
    public BackupRecord getDetail(Long id) {
        return backupRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", id));
    }

    @Override
    public Map<String, Object> verifyBackup(Long id) {
        log.info("Verifying backup ID: {}", id);
        BackupRecord backup = getDetail(id);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("backupId", id);
        result.put("backupName", backup.getBackupName());

        if (backup.getStoragePath() == null) {
            result.put("verified", false);
            result.put("message", "Backup file path is missing");
            return result;
        }

        File file = new File(backup.getStoragePath());
        if (!file.exists()) {
            result.put("verified", false);
            result.put("message", "Backup file not found at: " + backup.getStoragePath());
            return result;
        }

        // Verify checksum if available
        if (backup.getChecksum() != null) {
            try {
                String currentChecksum = calculateChecksum(file);
                boolean checksumMatch = backup.getChecksum().equals(currentChecksum);
                result.put("verified", checksumMatch);
                result.put("checksumMatch", checksumMatch);
                result.put("expectedChecksum", backup.getChecksum());
                result.put("actualChecksum", currentChecksum);
                result.put("message", checksumMatch ? "Backup integrity verified" : "Checksum mismatch - backup may be corrupted");
            } catch (Exception e) {
                result.put("verified", false);
                result.put("message", "Error calculating checksum: " + e.getMessage());
            }
        } else {
            result.put("verified", true);
            result.put("message", "Backup file exists (no checksum to verify)");
        }

        result.put("fileSize", file.length());
        result.put("lastModified", file.lastModified());
        return result;
    }

    @Override
    @Transactional
    public void deleteBackup(Long id) {
        log.info("Deleting backup ID: {}", id);
        BackupRecord backup = getDetail(id);

        // Delete physical file
        if (backup.getStoragePath() != null) {
            File file = new File(backup.getStoragePath());
            if (file.exists() && !file.delete()) {
                log.warn("Could not delete backup file: {}", backup.getStoragePath());
            }
        }

        backupRecordRepository.delete(backup);
        log.info("Backup deleted: {}", backup.getBackupName());
    }

    @Override
    public Resource downloadBackup(Long id) {
        BackupRecord backup = getDetail(id);
        if (backup.getStoragePath() == null) {
            throw new BadRequestException("Backup file path is missing");
        }

        try {
            Path filePath = Paths.get(backup.getStoragePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Backup file not found at: " + backup.getStoragePath());
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("Invalid backup file path: " + e.getMessage());
        }
    }

    // ==================== MANUAL BACKUP (FR-BACK-003) ====================

    @Override
    @Transactional
    public BackupRecord runManualBackup(String backupName, BackupType backupType,
                                         List<String> includes, StorageLocation storageLocation,
                                         Boolean encrypted) {
        log.info("Starting manual backup: name={}, type={}, includes={}", backupName, backupType, includes);

        // Check if a backup is already running
        List<BackupRecord> inProgress = backupRecordRepository.findByStatus(BackupStatus.IN_PROGRESS);
        if (!inProgress.isEmpty()) {
            throw new BadRequestException("Another backup is already in progress");
        }

        // Create backup directory if it doesn't exist
        ensureStorageDirectory();

        // Create backup filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = (backupName != null ? backupName : "backup") + "_" + timestamp + ".sql";
        String fullPath = Paths.get(storagePath, fileName).toString();

        // Get current user
        User currentUser = getCurrentUser();

        // Create backup record
        BackupRecord record = BackupRecord.builder()
                .backupName(backupName != null ? backupName : "Manual Backup " + timestamp)
                .backupType(backupType != null ? backupType : BackupType.MANUAL)
                .status(BackupStatus.IN_PROGRESS)
                .storageLocation(storageLocation != null ? storageLocation : StorageLocation.LOCAL)
                .storagePath(fullPath)
                .includes(includes != null ? "[\"" + String.join("\",\"", includes) + "\"]" : "[\"DATABASE\"]")
                .encrypted(encrypted != null ? encrypted : false)
                .startedAt(LocalDateTime.now())
                .progressPercent(0)
                .currentStep("Initializing backup...")
                .createdBy(currentUser)
                .build();
        record = backupRecordRepository.save(record);

        // Execute backup asynchronously (run after transaction commits)
        final Long recordId = record.getId();
        final String backupPath = fullPath;
        final List<String> backupIncludes = includes;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                CompletableFuture.runAsync(() -> executeBackupAsync(recordId, backupPath, backupIncludes));
            }
        });

        return record;
    }

    private void executeBackupAsync(Long recordId, String outputPath, List<String> includes) {
        try {
            // Update progress
            updateProgress(recordId, 10, "Preparing database dump...");

            // Execute mysqldump
            Map<String, Object> options = new HashMap<>();
            if (includes != null) {
                options.put("includes", includes);
            }
            databaseService.executeMySQLDump(outputPath, options);

            updateProgress(recordId, 80, "Writing backup file...");

            // Calculate file size and checksum
            File backupFile = new File(outputPath);
            long fileSize = backupFile.exists() ? backupFile.length() : 0;
            String checksum = backupFile.exists() ? calculateChecksum(backupFile) : null;

            updateProgress(recordId, 95, "Finalizing...");

            // Update record as completed
            completeBackup(recordId, fileSize, checksum);

        } catch (Exception e) {
            log.error("Backup failed for record {}: {}", recordId, e.getMessage(), e);
            failBackup(recordId, e.getMessage());
        }
    }

    private void updateProgress(Long recordId, int percent, String step) {
        backupRecordRepository.findById(recordId).ifPresent(record -> {
            record.setProgressPercent(percent);
            record.setCurrentStep(step);
            backupRecordRepository.save(record);
        });
    }

    private void completeBackup(Long recordId, long fileSize, String checksum) {
        backupRecordRepository.findById(recordId).ifPresent(record -> {
            record.setStatus(BackupStatus.COMPLETED);
            record.setSize(fileSize);
            record.setChecksum(checksum);
            record.setCompletedAt(LocalDateTime.now());
            record.setProgressPercent(100);
            record.setCurrentStep("Completed");
            if (record.getStartedAt() != null) {
                record.setDuration(java.time.Duration.between(record.getStartedAt(), LocalDateTime.now()).toMillis());
            }
            backupRecordRepository.save(record);
            log.info("Backup completed: {} ({}bytes)", record.getBackupName(), fileSize);

            // Send notification: backup completed
            try {
                notificationEventService.onBackupCompleted(record.getBackupName());
            } catch (Exception e) {
                log.warn("Failed to send backup notification: {}", e.getMessage());
            }
        });
    }

    private void failBackup(Long recordId, String errorMessage) {
        backupRecordRepository.findById(recordId).ifPresent(record -> {
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(errorMessage);
            record.setCompletedAt(LocalDateTime.now());
            record.setCurrentStep("Failed");
            if (record.getStartedAt() != null) {
                record.setDuration(java.time.Duration.between(record.getStartedAt(), LocalDateTime.now()).toMillis());
            }
            backupRecordRepository.save(record);
        });
    }

    @Override
    public BackupRecord getBackupProgress(Long id) {
        return getDetail(id);
    }

    @Override
    @Transactional
    public void cancelBackup(Long id) {
        BackupRecord backup = getDetail(id);
        if (backup.getStatus() != BackupStatus.IN_PROGRESS) {
            throw new BadRequestException("Can only cancel in-progress backups");
        }
        backup.setStatus(BackupStatus.CANCELLED);
        backup.setCompletedAt(LocalDateTime.now());
        backup.setCurrentStep("Cancelled by user");
        backupRecordRepository.save(backup);
        log.info("Backup cancelled: {}", backup.getBackupName());
    }

    // ==================== SCHEDULE ====================

    @Override
    public List<BackupSchedule> getSchedules() {
        return backupScheduleRepository.findAll();
    }

    @Override
    @Transactional
    public BackupSchedule createSchedule(BackupSchedule schedule) {
        log.info("Creating backup schedule: {}", schedule.getName());
        if (backupScheduleRepository.existsByName(schedule.getName())) {
            throw new BadRequestException("Schedule with name '" + schedule.getName() + "' already exists");
        }
        schedule.setCreatedBy(getCurrentUser());
        return backupScheduleRepository.save(schedule);
    }

    @Override
    @Transactional
    public BackupSchedule updateSchedule(Long id, BackupSchedule updated) {
        BackupSchedule existing = backupScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BackupSchedule", "id", id));

        existing.setName(updated.getName());
        existing.setBackupType(updated.getBackupType());
        existing.setCronExpression(updated.getCronExpression());
        existing.setStorageLocation(updated.getStorageLocation());
        existing.setRetentionDays(updated.getRetentionDays());
        existing.setEncrypted(updated.getEncrypted());
        existing.setIncludes(updated.getIncludes());
        existing.setEnabled(updated.getEnabled());
        existing.setStoragePath(updated.getStoragePath());
        existing.setMaxBackups(updated.getMaxBackups());

        return backupScheduleRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        if (!backupScheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("BackupSchedule", "id", id);
        }
        backupScheduleRepository.deleteById(id);
    }

    @Override
    @Transactional
    public BackupSchedule toggleSchedule(Long id, boolean enabled) {
        BackupSchedule schedule = backupScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BackupSchedule", "id", id));
        schedule.setEnabled(enabled);
        return backupScheduleRepository.save(schedule);
    }

    // ==================== HELPER ====================

    private void ensureStorageDirectory() {
        try {
            Path path = Paths.get(storagePath);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("Created backup storage directory: {}", storagePath);
            }
        } catch (IOException e) {
            throw new BadRequestException("Cannot create backup directory: " + e.getMessage());
        }
    }

    private String calculateChecksum(File file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = Files.readAllBytes(file.toPath());
            byte[] hash = digest.digest(fileBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("Cannot calculate checksum: {}", e.getMessage());
            return null;
        }
    }

    private User getCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }
}
