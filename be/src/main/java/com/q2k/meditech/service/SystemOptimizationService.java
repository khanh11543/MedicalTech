package com.q2k.meditech.service;

import com.q2k.meditech.entity.SystemOptimizationLog;
import com.q2k.meditech.entity.enums.OptimizationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service interface for System Optimization operations (FR-BACK-006)
 */
public interface SystemOptimizationService {

    // ==================== DATABASE HEALTH ====================

    /**
     * Check database health: table stats, fragmentation, health score
     * @return Map containing: tables, totalSize, fragmentation, healthScore, recommendations
     */
    Map<String, Object> getDatabaseHealth();

    // ==================== OPTIMIZE ====================

    /**
     * Defragment database
     */
    SystemOptimizationLog defragmentDatabase();

    /**
     * Rebuild all indexes
     */
    SystemOptimizationLog rebuildIndexes();

    /**
     * Clean up orphaned records
     */
    SystemOptimizationLog cleanOrphanedRecords();

    /**
     * Vacuum database (optimize table)
     */
    SystemOptimizationLog vacuumDatabase();

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Get cache statistics
     * @return Map containing: cacheNames, totalEntries, hitRate, missRate
     */
    Map<String, Object> getCacheStats();

    /**
     * Clear cache by type
     * @param cacheTypes List of cache types to clear (null = clear all)
     */
    SystemOptimizationLog clearCache(List<String> cacheTypes);

    // ==================== CLEANUP ====================

    /**
     * Preview data to be deleted
     * @param dataTypes Data types: audit_logs, login_attempts, notifications, sessions...
     * @param beforeDate Delete data before this date
     * @return Map containing: dataTypes -> {count, size}
     */
    Map<String, Object> previewCleanup(List<String> dataTypes, LocalDateTime beforeDate);

    /**
     * Execute old data cleanup
     * @param dataTypes Data types to clean
     * @param beforeDate Delete data before this date
     * @return SystemOptimizationLog result
     */
    SystemOptimizationLog executeCleanup(List<String> dataTypes, LocalDateTime beforeDate);

    // ==================== FILE SYSTEM ====================

    /**
     * Get disk usage information
     * @return Map containing: totalSpace, usedSpace, freeSpace, backupSize, logSize, tempSize
     */
    Map<String, Object> getDiskUsage();

    /**
     * Find duplicate files
     * @return List of duplicate file groups
     */
    List<Map<String, Object>> findDuplicateFiles();

    /**
     * Archive old logs
     * @param beforeDate Archive logs before this date
     * @return SystemOptimizationLog
     */
    SystemOptimizationLog archiveLogs(LocalDateTime beforeDate);

    // ==================== HISTORY ====================

    /**
     * Get paginated optimization history
     */
    Page<SystemOptimizationLog> getOptimizationHistory(Pageable pageable);
}
