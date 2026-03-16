package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import com.q2k.meditech.service.BackupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Backup Controller
 * Base path: /api/admin/backups
 *
 * APIs for backup management: dashboard, history, manual backup, schedules
 * All endpoints require ADMIN role
 *
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/backups")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Backup Management", description = "APIs for backup dashboard, history, manual backup and schedule management")
public class BackupController {

    private final BackupService backupService;

    // ==================== DASHBOARD (FR-BACK-001) ====================

    /**
     * GET /api/admin/backups/dashboard
     * Get backup dashboard overview
     */
    @GetMapping("/dashboard")
    @Operation(
        summary = "Get backup dashboard",
        description = "Get backup dashboard overview including last backup info, next scheduled, health status and storage info"
    )
    public ResponseEntity<Map<String, Object>> getDashboard() {
        log.info("GET /admin/backups/dashboard");
        Map<String, Object> dashboard = backupService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    // ==================== HISTORY (FR-BACK-002) ====================

    /**
     * GET /api/admin/backups/history
     * Get backup history with filters and pagination
     */
    @GetMapping("/history")
    @Operation(
        summary = "Get backup history",
        description = "Get paginated backup history with filters by type, status, location and date range"
    )
    public ResponseEntity<Page<BackupRecord>> getHistory(
            @Parameter(description = "Filter by backup type")
            @RequestParam(required = false) BackupType type,
            @Parameter(description = "Filter by status")
            @RequestParam(required = false) BackupStatus status,
            @Parameter(description = "Filter by storage location")
            @RequestParam(required = false) StorageLocation location,
            @Parameter(description = "Start date (yyyy-MM-dd'T'HH:mm:ss)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date (yyyy-MM-dd'T'HH:mm:ss)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "startedAt") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/backups/history - type: {}, status: {}, location: {}", type, status, location);

        String safeSortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                sortBy, java.util.Set.of("startedAt", "id"), "startedAt");
        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<BackupRecord> history = backupService.getHistory(type, status, location, startDate, endDate, pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/admin/backups/{id}
     * Get backup detail by ID
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get backup detail",
        description = "Get full backup record detail by ID"
    )
    public ResponseEntity<BackupRecord> getDetail(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/backups/{}", id);
        BackupRecord record = backupService.getDetail(id);
        return ResponseEntity.ok(record);
    }

    /**
     * POST /api/admin/backups/{id}/verify
     * Verify backup integrity (checksum)
     */
    @PostMapping("/{id}/verify")
    @Operation(
        summary = "Verify backup integrity",
        description = "Verify backup file integrity using SHA-256 checksum"
    )
    public ResponseEntity<Map<String, Object>> verifyBackup(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("POST /admin/backups/{}/verify", id);
        Map<String, Object> result = backupService.verifyBackup(id);
        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/admin/backups/{id}
     * Delete a backup record and its file
     */
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete backup",
        description = "Delete backup record and its associated file from storage"
    )
    public ResponseEntity<Map<String, String>> deleteBackup(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("DELETE /admin/backups/{}", id);
        backupService.deleteBackup(id);
        return ResponseEntity.ok(Map.of("message", "Backup deleted successfully"));
    }

    /**
     * GET /api/admin/backups/{id}/download
     * Download backup file
     */
    @GetMapping("/{id}/download")
    @Operation(
        summary = "Download backup file",
        description = "Download the backup file by ID"
    )
    public ResponseEntity<Resource> downloadBackup(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/backups/{}/download", id);
        Resource resource = backupService.downloadBackup(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // ==================== MANUAL BACKUP (FR-BACK-003) ====================

    /**
     * POST /api/admin/backups/manual
     * Run a manual backup
     */
    @PostMapping("/manual")
    @Operation(
        summary = "Run manual backup",
        description = "Start a manual backup with specified type, includes, storage location and encryption option"
    )
    public ResponseEntity<BackupRecord> runManualBackup(
            @RequestBody ManualBackupRequestDTO request) {

        log.info("POST /admin/backups/manual - name: {}, type: {}, includes: {}",
                request.getBackupName(), request.getBackupType(), request.getIncludes());

        BackupRecord record = backupService.runManualBackup(
                request.getBackupName(),
                request.getBackupType(),
                request.getIncludes(),
                request.getStorageLocation(),
                request.getEncrypted()
        );

        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/admin/backups/{id}/progress
     * Get backup progress
     */
    @GetMapping("/{id}/progress")
    @Operation(
        summary = "Get backup progress",
        description = "Get current progress of a running backup"
    )
    public ResponseEntity<BackupRecord> getBackupProgress(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/backups/{}/progress", id);
        BackupRecord record = backupService.getBackupProgress(id);
        return ResponseEntity.ok(record);
    }

    /**
     * POST /api/admin/backups/{id}/cancel
     * Cancel a running backup
     */
    @PostMapping("/{id}/cancel")
    @Operation(
        summary = "Cancel backup",
        description = "Cancel a backup that is currently in progress"
    )
    public ResponseEntity<Map<String, String>> cancelBackup(
            @Parameter(description = "Backup ID", required = true)
            @PathVariable Long id) {

        log.info("POST /admin/backups/{}/cancel", id);
        backupService.cancelBackup(id);
        return ResponseEntity.ok(Map.of("message", "Backup cancelled successfully"));
    }

    // ==================== SCHEDULE ====================

    /**
     * GET /api/admin/backups/schedules
     * Get all backup schedules
     */
    @GetMapping("/schedules")
    @Operation(
        summary = "Get all backup schedules",
        description = "Get list of all backup schedules"
    )
    public ResponseEntity<List<BackupSchedule>> getSchedules() {
        log.info("GET /admin/backups/schedules");
        List<BackupSchedule> schedules = backupService.getSchedules();
        return ResponseEntity.ok(schedules);
    }

    /**
     * POST /api/admin/backups/schedules
     * Create a new backup schedule
     */
    @PostMapping("/schedules")
    @Operation(
        summary = "Create backup schedule",
        description = "Create a new backup schedule with cron expression"
    )
    public ResponseEntity<BackupSchedule> createSchedule(
            @RequestBody BackupScheduleDTO dto) {

        log.info("POST /admin/backups/schedules - name: {}, cron: {}", dto.getName(), dto.getCronExpression());

        BackupSchedule schedule = BackupSchedule.builder()
                .name(dto.getName())
                .backupType(dto.getBackupType())
                .cronExpression(dto.getCronExpression())
                .storageLocation(dto.getStorageLocation())
                .retentionDays(dto.getRetentionDays())
                .encrypted(dto.getEncrypted())
                .includes(dto.getIncludes())
                .enabled(dto.getEnabled())
                .storagePath(dto.getStoragePath())
                .maxBackups(dto.getMaxBackups())
                .build();

        BackupSchedule created = backupService.createSchedule(schedule);
        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/admin/backups/schedules/{id}
     * Update an existing backup schedule
     */
    @PutMapping("/schedules/{id}")
    @Operation(
        summary = "Update backup schedule",
        description = "Update an existing backup schedule"
    )
    public ResponseEntity<BackupSchedule> updateSchedule(
            @Parameter(description = "Schedule ID", required = true)
            @PathVariable Long id,
            @RequestBody BackupScheduleDTO dto) {

        log.info("PUT /admin/backups/schedules/{} - name: {}", id, dto.getName());

        BackupSchedule schedule = BackupSchedule.builder()
                .name(dto.getName())
                .backupType(dto.getBackupType())
                .cronExpression(dto.getCronExpression())
                .storageLocation(dto.getStorageLocation())
                .retentionDays(dto.getRetentionDays())
                .encrypted(dto.getEncrypted())
                .includes(dto.getIncludes())
                .enabled(dto.getEnabled())
                .storagePath(dto.getStoragePath())
                .maxBackups(dto.getMaxBackups())
                .build();

        BackupSchedule updated = backupService.updateSchedule(id, schedule);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/admin/backups/schedules/{id}
     * Delete a backup schedule
     */
    @DeleteMapping("/schedules/{id}")
    @Operation(
        summary = "Delete backup schedule",
        description = "Delete a backup schedule by ID"
    )
    public ResponseEntity<Map<String, String>> deleteSchedule(
            @Parameter(description = "Schedule ID", required = true)
            @PathVariable Long id) {

        log.info("DELETE /admin/backups/schedules/{}", id);
        backupService.deleteSchedule(id);
        return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
    }

    /**
     * PUT /api/admin/backups/schedules/{id}/toggle
     * Enable or disable a backup schedule
     */
    @PutMapping("/schedules/{id}/toggle")
    @Operation(
        summary = "Toggle backup schedule",
        description = "Enable or disable a backup schedule"
    )
    public ResponseEntity<BackupSchedule> toggleSchedule(
            @Parameter(description = "Schedule ID", required = true)
            @PathVariable Long id,
            @Parameter(description = "Enable or disable", required = true)
            @RequestParam boolean enabled) {

        log.info("PUT /admin/backups/schedules/{}/toggle - enabled: {}", id, enabled);
        BackupSchedule schedule = backupService.toggleSchedule(id, enabled);
        return ResponseEntity.ok(schedule);
    }
}
