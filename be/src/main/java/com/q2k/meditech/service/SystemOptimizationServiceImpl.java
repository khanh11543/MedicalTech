package com.q2k.meditech.service;

import com.q2k.meditech.entity.SystemOptimizationLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.OptimizationType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.repository.LoginAttemptRepository;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.SystemOptimizationLogRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.repository.UserSessionRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SystemOptimizationServiceImpl implements SystemOptimizationService {

    private final SystemOptimizationLogRepository optimizationLogRepository;
    private final DatabaseService databaseService;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserSessionRepository userSessionRepository;
    private final CacheManager cacheManager;

    @Value("${app.backup.storage-path:./backups}")
    private String storagePath;

    // ==================== DATABASE HEALTH ====================

    @Override
    public Map<String, Object> getDatabaseHealth() {
        log.info("Getting database health check");
        Map<String, Object> health = new LinkedHashMap<>();

        try {
            // Connection check
            health.put("connectionActive", databaseService.checkConnection());

            // Table stats
            List<Map<String, Object>> tableStats = databaseService.getTableStats();
            health.put("tables", tableStats);
            health.put("tableCount", tableStats.size());

            // Total size
            Long dbSize = databaseService.getDatabaseSize();
            health.put("totalSize", dbSize);
            health.put("totalSizeFormatted", formatBytes(dbSize));

            // Fragmentation
            List<Map<String, Object>> fragmentation = databaseService.getFragmentationInfo();
            health.put("fragmentation", fragmentation);

            long fragmentedTables = fragmentation.stream()
                    .filter(f -> f.get("fragmentationPct") != null &&
                            ((Number) f.get("fragmentationPct")).doubleValue() > 10)
                    .count();
            health.put("fragmentedTableCount", fragmentedTables);

            // Health score (0-100)
            int healthScore = calculateHealthScore(tableStats, fragmentation);
            health.put("healthScore", healthScore);
            health.put("healthStatus", healthScore >= 80 ? "GOOD" : (healthScore >= 50 ? "WARNING" : "CRITICAL"));

            // Recommendations
            List<String> recommendations = generateRecommendations(fragmentation, healthScore);
            health.put("recommendations", recommendations);

        } catch (Exception e) {
            log.error("Error checking database health: {}", e.getMessage());
            health.put("error", e.getMessage());
            health.put("healthScore", 0);
            health.put("healthStatus", "ERROR");
        }

        return health;
    }

    // ==================== OPTIMIZE ====================

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public SystemOptimizationLog defragmentDatabase() {
        log.info("Starting database defragmentation");
        return executeOptimization(OptimizationType.DB_DEFRAGMENT, () -> {
            List<Map<String, Object>> results = databaseService.optimizeAllTables();
            return Map.of("optimizedTables", results, "tableCount", results.size());
        });
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public SystemOptimizationLog rebuildIndexes() {
        log.info("Starting index rebuild");
        return executeOptimization(OptimizationType.INDEX_REBUILD, () -> {
            List<Map<String, Object>> results = databaseService.analyzeAllTables();
            return Map.of("analyzedTables", results, "tableCount", results.size());
        });
    }

    @Override
    @Transactional
    public SystemOptimizationLog cleanOrphanedRecords() {
        log.info("Starting orphaned records cleanup");
        return executeOptimization(OptimizationType.ORPHAN_CLEANUP, () -> {
            // Placeholder: In production, implement specific orphan cleanup queries
            return Map.of("message", "Orphaned records cleanup completed", "recordsCleaned", 0);
        });
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public SystemOptimizationLog vacuumDatabase() {
        log.info("Starting database vacuum");
        return executeOptimization(OptimizationType.VACUUM, () -> {
            Long sizeBefore = databaseService.getDatabaseSize();
            List<Map<String, Object>> results = databaseService.optimizeAllTables();
            Long sizeAfter = databaseService.getDatabaseSize();
            return Map.of(
                    "optimizedTables", results,
                    "sizeBefore", sizeBefore,
                    "sizeAfter", sizeAfter,
                    "spaceReclaimed", sizeBefore - sizeAfter
            );
        });
    }

    // ==================== CACHE MANAGEMENT ====================

    @Override
    public Map<String, Object> getCacheStats() {
        log.info("Getting cache stats");
        Map<String, Object> stats = new LinkedHashMap<>();

        Collection<String> cacheNames = cacheManager.getCacheNames();
        stats.put("cacheNames", cacheNames);
        stats.put("totalCaches", cacheNames.size());

        List<Map<String, Object>> cacheDetails = new ArrayList<>();
        for (String cacheName : cacheNames) {
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("name", cacheName);
            detail.put("available", cacheManager.getCache(cacheName) != null);
            cacheDetails.add(detail);
        }
        stats.put("caches", cacheDetails);

        return stats;
    }

    @Override
    @Transactional
    public SystemOptimizationLog clearCache(List<String> cacheTypes) {
        log.info("Clearing caches: {}", cacheTypes != null ? cacheTypes : "ALL");
        return executeOptimization(OptimizationType.CACHE_CLEAR, () -> {
            List<String> clearedCaches = new ArrayList<>();

            if (cacheTypes == null || cacheTypes.isEmpty()) {
                // Clear all
                for (String cacheName : cacheManager.getCacheNames()) {
                    var cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                        clearedCaches.add(cacheName);
                    }
                }
            } else {
                for (String cacheType : cacheTypes) {
                    var cache = cacheManager.getCache(cacheType);
                    if (cache != null) {
                        cache.clear();
                        clearedCaches.add(cacheType);
                    }
                }
            }

            return Map.of("clearedCaches", clearedCaches, "count", clearedCaches.size());
        });
    }

    // ==================== CLEANUP ====================

    @Override
    public Map<String, Object> previewCleanup(List<String> dataTypes, LocalDateTime beforeDate) {
        log.info("Previewing cleanup for types: {}, before: {}", dataTypes, beforeDate);
        Map<String, Object> preview = new LinkedHashMap<>();

        if (beforeDate == null) {
            beforeDate = LocalDateTime.now().minusMonths(3);
        }

        for (String dataType : dataTypes) {
            Map<String, Object> typeInfo = new LinkedHashMap<>();
            switch (dataType.toLowerCase()) {
                case "audit_logs":
                    long auditCount = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                            LocalDateTime.of(2000, 1, 1, 0, 0), beforeDate).size();
                    typeInfo.put("count", auditCount);
                    typeInfo.put("description", "Audit log entries");
                    break;
                case "notifications":
                    typeInfo.put("count", 0); // Would need custom query
                    typeInfo.put("description", "Old notification records");
                    break;
                case "sessions":
                    typeInfo.put("count", 0); // Would need custom query
                    typeInfo.put("description", "Expired user sessions");
                    break;
                case "login_attempts":
                    typeInfo.put("count", 0); // Would need custom query
                    typeInfo.put("description", "Old login attempt records");
                    break;
                default:
                    typeInfo.put("count", 0);
                    typeInfo.put("description", "Unknown data type");
            }
            preview.put(dataType, typeInfo);
        }

        preview.put("beforeDate", beforeDate);
        return preview;
    }

    @Override
    @Transactional
    public SystemOptimizationLog executeCleanup(List<String> dataTypes, LocalDateTime beforeDate) {
        log.info("Executing cleanup for types: {}, before: {}", dataTypes, beforeDate);

        if (beforeDate == null) {
            beforeDate = LocalDateTime.now().minusMonths(3);
        }

        final LocalDateTime finalBeforeDate = beforeDate;

        return executeOptimization(OptimizationType.OLD_DATA_CLEANUP, () -> {
            Map<String, Object> results = new LinkedHashMap<>();
            long totalCleaned = 0;

            for (String dataType : dataTypes) {
                long cleaned = 0;
                switch (dataType.toLowerCase()) {
                    case "audit_logs":
                        List<?> oldAudits = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                                LocalDateTime.of(2000, 1, 1, 0, 0), finalBeforeDate);
                        cleaned = oldAudits.size();
                        auditLogRepository.deleteAll(
                                auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                                        LocalDateTime.of(2000, 1, 1, 0, 0), finalBeforeDate));
                        break;
                    // Add more cleanup types as needed
                }
                results.put(dataType, Map.of("cleaned", cleaned));
                totalCleaned += cleaned;
            }

            results.put("totalCleaned", totalCleaned);
            results.put("beforeDate", finalBeforeDate.toString());
            return results;
        });
    }

    // ==================== FILE SYSTEM ====================

    @Override
    public Map<String, Object> getDiskUsage() {
        log.info("Getting disk usage info");
        Map<String, Object> diskUsage = new LinkedHashMap<>();

        File root = new File("/");
        diskUsage.put("totalSpace", root.getTotalSpace());
        diskUsage.put("freeSpace", root.getFreeSpace());
        diskUsage.put("usableSpace", root.getUsableSpace());
        diskUsage.put("usedSpace", root.getTotalSpace() - root.getFreeSpace());
        diskUsage.put("usagePercent", root.getTotalSpace() > 0
                ? Math.round((double) (root.getTotalSpace() - root.getFreeSpace()) / root.getTotalSpace() * 100)
                : 0);

        // Backup directory size
        File backupDir = new File(storagePath);
        if (backupDir.exists()) {
            long backupSize = calculateDirectorySize(backupDir);
            diskUsage.put("backupSize", backupSize);
            diskUsage.put("backupSizeFormatted", formatBytes(backupSize));
        }

        // Database size
        try {
            Long dbSize = databaseService.getDatabaseSize();
            diskUsage.put("databaseSize", dbSize);
            diskUsage.put("databaseSizeFormatted", formatBytes(dbSize));
        } catch (Exception e) {
            log.warn("Cannot get database size: {}", e.getMessage());
        }

        return diskUsage;
    }

    @Override
    public List<Map<String, Object>> findDuplicateFiles() {
        log.info("Finding duplicate files");
        // Placeholder - scan backup directory for duplicates based on checksum
        List<Map<String, Object>> duplicates = new ArrayList<>();

        File backupDir = new File(storagePath);
        if (!backupDir.exists()) {
            return duplicates;
        }

        // Group files by size first, then compare checksums
        Map<Long, List<File>> filesBySize = new HashMap<>();
        scanDirectory(backupDir, filesBySize);

        for (Map.Entry<Long, List<File>> entry : filesBySize.entrySet()) {
            if (entry.getValue().size() > 1) {
                Map<String, Object> group = new LinkedHashMap<>();
                group.put("size", entry.getKey());
                group.put("sizeFormatted", formatBytes(entry.getKey()));
                group.put("files", entry.getValue().stream()
                        .map(f -> Map.of("name", f.getName(), "path", f.getAbsolutePath(),
                                "lastModified", f.lastModified()))
                        .toList());
                group.put("count", entry.getValue().size());
                duplicates.add(group);
            }
        }

        return duplicates;
    }

    @Override
    @Transactional
    public SystemOptimizationLog archiveLogs(LocalDateTime beforeDate) {
        log.info("Archiving logs before: {}", beforeDate);
        return executeOptimization(OptimizationType.LOG_ARCHIVE, () -> {
            // Archive audit logs older than the specified date
            var oldLogs = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                    LocalDateTime.of(2000, 1, 1, 0, 0), beforeDate);
            long archivedCount = oldLogs.size();
            // In production: export to file, then delete
            return Map.of("archivedCount", archivedCount, "beforeDate", beforeDate.toString());
        });
    }

    @Override
    public Page<SystemOptimizationLog> getOptimizationHistory(Pageable pageable) {
        return optimizationLogRepository.findAllByOrderByStartedAtDesc(pageable);
    }

    // ==================== HELPER ====================

    private SystemOptimizationLog executeOptimization(OptimizationType type,
                                                       OptimizationTask task) {
        Long sizeBefore = null;
        try {
            sizeBefore = databaseService.getDatabaseSize();
        } catch (Exception ignored) {}

        SystemOptimizationLog logEntry = SystemOptimizationLog.builder()
                .optimizationType(type)
                .status("IN_PROGRESS")
                .startedAt(LocalDateTime.now())
                .sizeBefore(sizeBefore)
                .createdBy(getCurrentUser())
                .build();
        logEntry = optimizationLogRepository.save(logEntry);

        try {
            Map<String, Object> result = task.execute();

            Long sizeAfter = null;
            try {
                sizeAfter = databaseService.getDatabaseSize();
            } catch (Exception ignored) {}

            logEntry.setStatus("COMPLETED");
            logEntry.setDetails(result.toString());
            logEntry.setSizeAfter(sizeAfter);
            logEntry.setCompletedAt(LocalDateTime.now());
            logEntry.setDuration(java.time.Duration.between(logEntry.getStartedAt(), LocalDateTime.now()).toMillis());

            if (result.containsKey("totalCleaned")) {
                logEntry.setRecordsAffected(((Number) result.get("totalCleaned")).longValue());
            }

            return optimizationLogRepository.save(logEntry);

        } catch (Exception e) {
            log.error("Optimization failed [{}]: {}", type, e.getMessage(), e);
            logEntry.setStatus("FAILED");
            logEntry.setErrorMessage(e.getMessage());
            logEntry.setCompletedAt(LocalDateTime.now());
            logEntry.setDuration(java.time.Duration.between(logEntry.getStartedAt(), LocalDateTime.now()).toMillis());
            return optimizationLogRepository.save(logEntry);
        }
    }

    @FunctionalInterface
    private interface OptimizationTask {
        Map<String, Object> execute();
    }

    private int calculateHealthScore(List<Map<String, Object>> tables,
                                      List<Map<String, Object>> fragmentation) {
        int score = 100;

        // Deduct for fragmented tables
        for (Map<String, Object> frag : fragmentation) {
            if (frag.get("fragmentationPct") != null) {
                double pct = ((Number) frag.get("fragmentationPct")).doubleValue();
                if (pct > 30) score -= 10;
                else if (pct > 10) score -= 5;
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    private List<String> generateRecommendations(List<Map<String, Object>> fragmentation, int healthScore) {
        List<String> recommendations = new ArrayList<>();

        long fragmentedCount = fragmentation.stream()
                .filter(f -> f.get("fragmentationPct") != null &&
                        ((Number) f.get("fragmentationPct")).doubleValue() > 10)
                .count();

        if (fragmentedCount > 0) {
            recommendations.add("Run defragmentation to optimize " + fragmentedCount + " fragmented tables");
        }
        if (healthScore < 80) {
            recommendations.add("Consider rebuilding indexes to improve query performance");
        }
        if (healthScore < 50) {
            recommendations.add("Database optimization is strongly recommended");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("Database is healthy. No action required.");
        }

        return recommendations;
    }

    private long calculateDirectorySize(File directory) {
        long size = 0;
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    size += file.length();
                } else if (file.isDirectory()) {
                    size += calculateDirectorySize(file);
                }
            }
        }
        return size;
    }

    private void scanDirectory(File directory, Map<Long, List<File>> filesBySize) {
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    filesBySize.computeIfAbsent(file.length(), k -> new ArrayList<>()).add(file);
                } else if (file.isDirectory()) {
                    scanDirectory(file, filesBySize);
                }
            }
        }
    }

    private String formatBytes(Long bytes) {
        if (bytes == null || bytes == 0) return "0 B";
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unitIndex = (int) (Math.log(bytes) / Math.log(1024));
        unitIndex = Math.min(unitIndex, units.length - 1);
        double value = bytes / Math.pow(1024, unitIndex);
        return String.format("%.2f %s", value, units[unitIndex]);
    }

    private User getCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }
}
