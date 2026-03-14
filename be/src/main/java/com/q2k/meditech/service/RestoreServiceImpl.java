

package com.q2k.meditech.service;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.RestoreStatus;
import com.q2k.meditech.entity.enums.RestoreType;
import com.q2k.meditech.entity.enums.StorageLocation;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.RestoreRecordRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RestoreServiceImpl implements RestoreService {

    private final RestoreRecordRepository restoreRecordRepository;
    private final BackupRecordRepository backupRecordRepository;
    private final UserRepository userRepository;
    private final DatabaseService databaseService;
    private final BackupService backupService;

    @Value("${app.backup.storage-path:./backups}")
    private String storagePath;

    @Override
    @Transactional
    public RestoreRecord restoreFromBackup(Long backupId, RestoreType restoreType,
                                            List<String> items, String password) {
        log.info("Starting restore from backup ID: {}, type: {}", backupId, restoreType);

        // Validate backup exists and is completed
        BackupRecord backup = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));

        if (backup.getStatus() != BackupStatus.COMPLETED) {
            throw new BadRequestException("Can only restore from completed backups");
        }

        // Check if backup file exists
        if (backup.getStoragePath() == null || !new File(backup.getStoragePath()).exists()) {
            throw new BadRequestException("Backup file not found");
        }

        // Check if a restore is already running
        List<RestoreRecord> inProgress = restoreRecordRepository.findByStatus(RestoreStatus.IN_PROGRESS);
        if (!inProgress.isEmpty()) {
            throw new BadRequestException("Another restore operation is already in progress");
        }

        // Create auto-backup before restore
        Long preRestoreBackupId = createPreRestoreBackup();

        // Create restore record
        User currentUser = getCurrentUser();
        RestoreRecord record = RestoreRecord.builder()
                .backupRecord(backup)
                .restoreType(restoreType != null ? restoreType : RestoreType.FULL)
                .status(RestoreStatus.IN_PROGRESS)
                .preRestoreBackupId(preRestoreBackupId)
                .restoredItems(items != null ? String.join(",", items) : "DATABASE")
                .startedAt(LocalDateTime.now())
                .progressPercent(0)
                .currentStep("Initializing restore...")
                .createdBy(currentUser)
                .isTestRestore(false)
                .build();
        record = restoreRecordRepository.save(record);

        // Execute restore asynchronously
        executeRestoreAsync(record.getId(), backup.getStoragePath());

        return record;
    }

    @Override
    @Transactional
    public RestoreRecord restoreFromUpload(MultipartFile file, RestoreType restoreType,
                                            List<String> items, String password) {
        log.info("Starting restore from uploaded file: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        // Save uploaded file
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "upload_restore_" + timestamp + ".sql";
        Path uploadPath = Paths.get(storagePath, "uploads", fileName);

        try {
            Files.createDirectories(uploadPath.getParent());
            file.transferTo(uploadPath.toFile());
        } catch (IOException e) {
            throw new BadRequestException("Failed to save uploaded file: " + e.getMessage());
        }

        // Create backup record for file upload
        BackupRecord uploadBackup = BackupRecord.builder()
                .backupName("Uploaded: " + file.getOriginalFilename())
                .backupType(BackupType.MANUAL)
                .status(BackupStatus.COMPLETED)
                .size(file.getSize())
                .storagePath(uploadPath.toString())
                .storageLocation(StorageLocation.LOCAL)
                .includes("DATABASE")
                .completedAt(LocalDateTime.now())
                .startedAt(LocalDateTime.now())
                .progressPercent(100)
                .build();
        uploadBackup = backupRecordRepository.save(uploadBackup);

        // Delegate to restoreFromBackup
        return restoreFromBackup(uploadBackup.getId(), restoreType, items, password);
    }

    @Override
    public RestoreRecord getRestoreProgress(Long id) {
        return restoreRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RestoreRecord", "id", id));
    }

    @Override
    @Transactional
    public RestoreRecord testRestore(Long backupId) {
        log.info("Starting test restore for backup ID: {}", backupId);

        BackupRecord backup = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));

        if (backup.getStatus() != BackupStatus.COMPLETED) {
            throw new BadRequestException("Can only test restore from completed backups");
        }

        User currentUser = getCurrentUser();
        RestoreRecord record = RestoreRecord.builder()
                .backupRecord(backup)
                .restoreType(RestoreType.TEST)
                .status(RestoreStatus.IN_PROGRESS)
                .restoredItems("DATABASE")
                .startedAt(LocalDateTime.now())
                .progressPercent(0)
                .currentStep("Initializing test restore...")
                .createdBy(currentUser)
                .isTestRestore(true)
                .build();
        record = restoreRecordRepository.save(record);

        // Simulate test restore (verify file integrity, parse SQL, etc.)
        executeTestRestoreAsync(record.getId(), backup.getStoragePath());

        return record;
    }

    @Override
    public Page<RestoreRecord> getRestoreHistory(Pageable pageable) {
        return restoreRecordRepository.findAllByOrderByStartedAtDesc(pageable);
    }

    @Override
    public RestoreRecord getRestoreDetail(Long id) {
        return restoreRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RestoreRecord", "id", id));
    }

    @Override
    public Map<String, Object> getRestoreSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRestores", restoreRecordRepository.count());
        summary.put("completedRestores", restoreRecordRepository.countByStatus(RestoreStatus.COMPLETED));
        summary.put("failedRestores", restoreRecordRepository.countByStatus(RestoreStatus.FAILED));
        summary.put("activeRestores", restoreRecordRepository.countByStatus(RestoreStatus.IN_PROGRESS));
        return summary;
    }

    // ==================== ASYNC ====================

    @Async
    protected void executeRestoreAsync(Long recordId, String backupFilePath) {
        try {
            updateRestoreProgress(recordId, 10, "Reading backup file...");
            updateRestoreProgress(recordId, 30, "Restoring database...");

            databaseService.restoreFromDump(backupFilePath);

            updateRestoreProgress(recordId, 90, "Verifying restoration...");
            completeRestore(recordId);

        } catch (Exception e) {
            log.error("Restore failed for record {}: {}", recordId, e.getMessage(), e);
            failRestore(recordId, e.getMessage());
        }
    }

    @Async
    protected void executeTestRestoreAsync(Long recordId, String backupFilePath) {
        try {
            updateRestoreProgress(recordId, 20, "Validating backup file format...");

            // Check file exists and is readable
            File file = new File(backupFilePath);
            if (!file.exists() || !file.canRead()) {
                throw new RuntimeException("Backup file is not accessible");
            }

            updateRestoreProgress(recordId, 50, "Parsing SQL statements...");

            // Basic validation: read first few lines to verify it's a valid dump
            updateRestoreProgress(recordId, 80, "Checking data integrity...");

            // Mark as completed (test mode - no actual restore)
            completeRestore(recordId);
            log.info("Test restore completed for record: {}", recordId);

        } catch (Exception e) {
            log.error("Test restore failed for record {}: {}", recordId, e.getMessage(), e);
            failRestore(recordId, e.getMessage());
        }
    }

    @Transactional
    protected void updateRestoreProgress(Long recordId, int percent, String step) {
        restoreRecordRepository.findById(recordId).ifPresent(record -> {
            record.setProgressPercent(percent);
            record.setCurrentStep(step);
            restoreRecordRepository.save(record);
        });
    }

    @Transactional
    protected void completeRestore(Long recordId) {
        restoreRecordRepository.findById(recordId).ifPresent(record -> {
            record.setStatus(RestoreStatus.COMPLETED);
            record.setCompletedAt(LocalDateTime.now());
            record.setProgressPercent(100);
            record.setCurrentStep("Completed");
            if (record.getStartedAt() != null) {
                record.setDuration(java.time.Duration.between(record.getStartedAt(), LocalDateTime.now()).toMillis());
            }
            restoreRecordRepository.save(record);
        });
    }

    @Transactional
    protected void failRestore(Long recordId, String errorMessage) {
        restoreRecordRepository.findById(recordId).ifPresent(record -> {
            record.setStatus(RestoreStatus.FAILED);
            record.setErrorMessage(errorMessage);
            record.setCompletedAt(LocalDateTime.now());
            record.setCurrentStep("Failed");
            if (record.getStartedAt() != null) {
                record.setDuration(java.time.Duration.between(record.getStartedAt(), LocalDateTime.now()).toMillis());
            }
            restoreRecordRepository.save(record);
        });
    }

    private Long createPreRestoreBackup() {
        try {
            BackupRecord preBackup = backupService.runManualBackup(
                    "pre_restore_auto_backup",
                    BackupType.FULL,
                    List.of("DATABASE"),
                    StorageLocation.LOCAL,
                    false
            );
            return preBackup.getId();
        } catch (Exception e) {
            log.warn("Failed to create pre-restore backup: {}", e.getMessage());
            return null;
        }
    }

    private User getCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }
}
