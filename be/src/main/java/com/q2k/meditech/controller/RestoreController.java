package com.q2k.meditech.controller;

import com.q2k.meditech.dto.RestoreRequestDTO;
import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.service.RestoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Restore Controller
 * Base path: /api/admin/restore
 *
 * APIs for restore management: restore from backup, upload, test, history
 * All endpoints require ADMIN role
 *
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/restore")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Restore Management", description = "APIs for restoring backups and managing restore history")
public class RestoreController {

    private final RestoreService restoreService;

    // ==================== RESTORE OPERATIONS (FR-BACK-004) ====================

    /**
     * POST /api/admin/restore/from-backup
     * Restore from an existing backup in the system
     */
    @PostMapping("/from-backup")
    @Operation(
        summary = "Restore from backup",
        description = "Restore system from an existing backup record. A pre-restore backup is automatically created."
    )
    public ResponseEntity<RestoreRecord> restoreFromBackup(
            @RequestBody RestoreRequestDTO request) {

        log.info("POST /admin/restore/from-backup - backupId: {}, type: {}",
                request.getBackupId(), request.getRestoreType());

        RestoreRecord record = restoreService.restoreFromBackup(
                request.getBackupId(),
                request.getRestoreType(),
                request.getItems(),
                request.getPassword()
        );

        return ResponseEntity.ok(record);
    }

    /**
     * POST /api/admin/restore/from-upload
     * Restore from an uploaded backup file
     */
    @PostMapping(value = "/from-upload", consumes = "multipart/form-data")
    @Operation(
        summary = "Restore from uploaded file",
        description = "Upload a backup file and restore from it. Supports .sql and .gz files."
    )
    public ResponseEntity<RestoreRecord> restoreFromUpload(
            @Parameter(description = "Backup file to upload", required = true)
            @RequestPart("file") MultipartFile file,
            @Parameter(description = "Restore type (FULL/PARTIAL)")
            @RequestParam(defaultValue = "FULL") String restoreType,
            @Parameter(description = "Items to restore (for PARTIAL)")
            @RequestParam(required = false) List<String> items,
            @Parameter(description = "Confirmation password")
            @RequestParam(required = false) String password) {

        log.info("POST /admin/restore/from-upload - file: {}, type: {}",
                file.getOriginalFilename(), restoreType);

        RestoreRecord record = restoreService.restoreFromUpload(
                file,
                com.q2k.meditech.entity.enums.RestoreType.valueOf(restoreType),
                items,
                password
        );

        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/admin/restore/{id}/progress
     * Get restore progress
     */
    @GetMapping("/{id}/progress")
    @Operation(
        summary = "Get restore progress",
        description = "Get current progress of a running restore operation"
    )
    public ResponseEntity<RestoreRecord> getRestoreProgress(
            @Parameter(description = "Restore record ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/restore/{}/progress", id);
        RestoreRecord record = restoreService.getRestoreProgress(id);
        return ResponseEntity.ok(record);
    }

    /**
     * POST /api/admin/restore/{backupId}/test
     * Test restore in sandbox mode
     */
    @PostMapping("/{backupId}/test")
    @Operation(
        summary = "Test restore",
        description = "Run a test restore in sandbox mode to verify backup integrity without affecting live data"
    )
    public ResponseEntity<RestoreRecord> testRestore(
            @Parameter(description = "Backup ID to test", required = true)
            @PathVariable Long backupId) {

        log.info("POST /admin/restore/{}/test", backupId);
        RestoreRecord record = restoreService.testRestore(backupId);
        return ResponseEntity.ok(record);
    }

    // ==================== HISTORY ====================

    /**
     * GET /api/admin/restore/history
     * Get restore history
     */
    @GetMapping("/history")
    @Operation(
        summary = "Get restore history",
        description = "Get paginated list of all restore operations"
    )
    public ResponseEntity<Page<RestoreRecord>> getRestoreHistory(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "startedAt") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/restore/history - page: {}, size: {}", pageNumber, pageSize);

        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<RestoreRecord> history = restoreService.getRestoreHistory(pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/admin/restore/{id}
     * Get restore detail
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get restore detail",
        description = "Get full restore record detail by ID"
    )
    public ResponseEntity<RestoreRecord> getRestoreDetail(
            @Parameter(description = "Restore record ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/restore/{}", id);
        RestoreRecord record = restoreService.getRestoreDetail(id);
        return ResponseEntity.ok(record);
    }

    /**
     * GET /api/admin/restore/summary
     * Get restore summary/overview
     */
    @GetMapping("/summary")
    @Operation(
        summary = "Get restore summary",
        description = "Get overview of restore operations including total count, last restore, active restores"
    )
    public ResponseEntity<Map<String, Object>> getRestoreSummary() {
        log.info("GET /admin/restore/summary");
        Map<String, Object> summary = restoreService.getRestoreSummary();
        return ResponseEntity.ok(summary);
    }
}
