package com.q2k.meditech.controller;

import com.q2k.meditech.dto.CleanupRequestDTO;
import com.q2k.meditech.entity.SystemOptimizationLog;
import com.q2k.meditech.service.SystemOptimizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * System Optimization Controller
 * Base path: /api/admin/optimization
 *
 * APIs for system optimization: database health, defragment, cache, cleanup, disk usage
 * All endpoints require ADMIN role
 *
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/optimization")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - System Optimization", description = "APIs for system optimization, database health, cache and cleanup management")
public class SystemOptimizationController {

    private final SystemOptimizationService optimizationService;

    // ==================== DATABASE HEALTH (FR-BACK-006) ====================

    /**
     * GET /api/admin/optimization/database-health
     * Get database health overview
     */
    @GetMapping("/database-health")
    @Operation(
        summary = "Get database health",
        description = "Get database health overview including table stats, fragmentation, health score and recommendations"
    )
    public ResponseEntity<Map<String, Object>> getDatabaseHealth() {
        log.info("GET /admin/optimization/database-health");
        Map<String, Object> health = optimizationService.getDatabaseHealth();
        return ResponseEntity.ok(health);
    }

    // ==================== OPTIMIZE OPERATIONS ====================

    /**
     * POST /api/admin/optimization/defragment
     * Defragment database tables
     */
    @PostMapping("/defragment")
    @Operation(
        summary = "Defragment database",
        description = "Run database defragmentation to reclaim disk space and improve performance"
    )
    public ResponseEntity<SystemOptimizationLog> defragmentDatabase() {
        log.info("POST /admin/optimization/defragment");
        SystemOptimizationLog result = optimizationService.defragmentDatabase();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/optimization/rebuild-indexes
     * Rebuild all database indexes
     */
    @PostMapping("/rebuild-indexes")
    @Operation(
        summary = "Rebuild indexes",
        description = "Rebuild all database indexes to improve query performance"
    )
    public ResponseEntity<SystemOptimizationLog> rebuildIndexes() {
        log.info("POST /admin/optimization/rebuild-indexes");
        SystemOptimizationLog result = optimizationService.rebuildIndexes();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/optimization/clean-orphans
     * Clean orphaned records
     */
    @PostMapping("/clean-orphans")
    @Operation(
        summary = "Clean orphaned records",
        description = "Find and remove orphaned records that are no longer referenced"
    )
    public ResponseEntity<SystemOptimizationLog> cleanOrphanedRecords() {
        log.info("POST /admin/optimization/clean-orphans");
        SystemOptimizationLog result = optimizationService.cleanOrphanedRecords();
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/optimization/vacuum
     * Vacuum database (optimize all tables)
     */
    @PostMapping("/vacuum")
    @Operation(
        summary = "Vacuum database",
        description = "Run OPTIMIZE TABLE on all tables to reclaim space and update statistics"
    )
    public ResponseEntity<SystemOptimizationLog> vacuumDatabase() {
        log.info("POST /admin/optimization/vacuum");
        SystemOptimizationLog result = optimizationService.vacuumDatabase();
        return ResponseEntity.ok(result);
    }

    // ==================== CACHE MANAGEMENT ====================

    /**
     * GET /api/admin/optimization/cache
     * Get cache statistics
     */
    @GetMapping("/cache")
    @Operation(
        summary = "Get cache statistics",
        description = "Get statistics about application caches including entry counts and hit rates"
    )
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        log.info("GET /admin/optimization/cache");
        Map<String, Object> stats = optimizationService.getCacheStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/admin/optimization/cache/clear
     * Clear caches
     */
    @PostMapping("/cache/clear")
    @Operation(
        summary = "Clear cache",
        description = "Clear specific caches or all caches. Pass empty cacheTypes to clear all."
    )
    public ResponseEntity<SystemOptimizationLog> clearCache(
            @Parameter(description = "Cache types to clear (null = all)")
            @RequestParam(required = false) List<String> cacheTypes) {

        log.info("POST /admin/optimization/cache/clear - types: {}", cacheTypes);
        SystemOptimizationLog result = optimizationService.clearCache(cacheTypes);
        return ResponseEntity.ok(result);
    }

    // ==================== CLEANUP ====================

    /**
     * POST /api/admin/optimization/cleanup/preview
     * Preview data that would be cleaned up
     */
    @PostMapping("/cleanup/preview")
    @Operation(
        summary = "Preview cleanup",
        description = "Preview what data would be deleted before performing cleanup. Shows record counts and estimated space savings."
    )
    public ResponseEntity<Map<String, Object>> previewCleanup(
            @Parameter(description = "Data types to clean: audit_logs, notifications, sessions, login_attempts", required = true)
            @RequestParam List<String> dataTypes,
            @Parameter(description = "Clean data before this date (yyyy-MM-dd'T'HH:mm:ss)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime beforeDate) {

        log.info("POST /admin/optimization/cleanup/preview - types: {}, before: {}", dataTypes, beforeDate);
        Map<String, Object> preview = optimizationService.previewCleanup(dataTypes, beforeDate);
        return ResponseEntity.ok(preview);
    }

    /**
     * POST /api/admin/optimization/cleanup/execute
     * Execute data cleanup
     */
    @PostMapping("/cleanup/execute")
    @Operation(
        summary = "Execute cleanup",
        description = "Execute cleanup of old data. Recommended to run preview first."
    )
    public ResponseEntity<SystemOptimizationLog> executeCleanup(
            @RequestBody CleanupRequestDTO request) {

        log.info("POST /admin/optimization/cleanup/execute - types: {}, before: {}",
                request.getDataTypes(), request.getBeforeDate());

        SystemOptimizationLog result = optimizationService.executeCleanup(
                request.getDataTypes(),
                request.getBeforeDate()
        );

        return ResponseEntity.ok(result);
    }

    // ==================== FILE SYSTEM ====================

    /**
     * GET /api/admin/optimization/disk-usage
     * Get disk usage information
     */
    @GetMapping("/disk-usage")
    @Operation(
        summary = "Get disk usage",
        description = "Get disk usage information including total space, used space, free space and directory breakdown"
    )
    public ResponseEntity<Map<String, Object>> getDiskUsage() {
        log.info("GET /admin/optimization/disk-usage");
        Map<String, Object> usage = optimizationService.getDiskUsage();
        return ResponseEntity.ok(usage);
    }

    /**
     * GET /api/admin/optimization/duplicate-files
     * Find duplicate files
     */
    @GetMapping("/duplicate-files")
    @Operation(
        summary = "Find duplicate files",
        description = "Scan storage for duplicate files grouped by file size"
    )
    public ResponseEntity<List<Map<String, Object>>> findDuplicateFiles() {
        log.info("GET /admin/optimization/duplicate-files");
        List<Map<String, Object>> duplicates = optimizationService.findDuplicateFiles();
        return ResponseEntity.ok(duplicates);
    }

    /**
     * POST /api/admin/optimization/archive-logs
     * Archive old logs
     */
    @PostMapping("/archive-logs")
    @Operation(
        summary = "Archive logs",
        description = "Archive old log files before a specified date"
    )
    public ResponseEntity<SystemOptimizationLog> archiveLogs(
            @Parameter(description = "Archive logs before this date (yyyy-MM-dd'T'HH:mm:ss)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime beforeDate) {

        log.info("POST /admin/optimization/archive-logs - before: {}", beforeDate);
        SystemOptimizationLog result = optimizationService.archiveLogs(beforeDate);
        return ResponseEntity.ok(result);
    }

    // ==================== HISTORY ====================

    /**
     * GET /api/admin/optimization/history
     * Get optimization history
     */
    @GetMapping("/history")
    @Operation(
        summary = "Get optimization history",
        description = "Get paginated history of all optimization operations"
    )
    public ResponseEntity<Page<SystemOptimizationLog>> getOptimizationHistory(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "startedAt") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/optimization/history - page: {}, size: {}", pageNumber, pageSize);

        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<SystemOptimizationLog> history = optimizationService.getOptimizationHistory(pageable);
        return ResponseEntity.ok(history);
    }
}
