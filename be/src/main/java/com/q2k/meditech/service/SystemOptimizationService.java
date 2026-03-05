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
     * Kiểm tra sức khỏe database: table stats, fragmentation, health score
     * @return Map chứa: tables, totalSize, fragmentation, healthScore, recommendations
     */
    Map<String, Object> getDatabaseHealth();

    // ==================== OPTIMIZE ====================

    /**
     * Chống phân mảnh database
     */
    SystemOptimizationLog defragmentDatabase();

    /**
     * Rebuild tất cả indexes
     */
    SystemOptimizationLog rebuildIndexes();

    /**
     * Dọn dẹp bản ghi orphan/mồ côi
     */
    SystemOptimizationLog cleanOrphanedRecords();

    /**
     * Vacuum database (optimize table)
     */
    SystemOptimizationLog vacuumDatabase();

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Lấy thống kê cache
     * @return Map chứa: cacheNames, totalEntries, hitRate, missRate
     */
    Map<String, Object> getCacheStats();

    /**
     * Xóa cache theo loại
     * @param cacheTypes Danh sách loại cache cần xóa (null = xóa tất cả)
     */
    SystemOptimizationLog clearCache(List<String> cacheTypes);

    // ==================== CLEANUP ====================

    /**
     * Xem trước dữ liệu sẽ bị xóa
     * @param dataTypes Loại dữ liệu: audit_logs, login_attempts, notifications, sessions...
     * @param beforeDate Xóa dữ liệu trước ngày này
     * @return Map chứa: dataTypes -> {count, size}
     */
    Map<String, Object> previewCleanup(List<String> dataTypes, LocalDateTime beforeDate);

    /**
     * Thực hiện dọn dẹp dữ liệu cũ
     * @param dataTypes Loại dữ liệu cần dọn
     * @param beforeDate Xóa dữ liệu trước ngày
     * @return SystemOptimizationLog kết quả
     */
    SystemOptimizationLog executeCleanup(List<String> dataTypes, LocalDateTime beforeDate);

    // ==================== FILE SYSTEM ====================

    /**
     * Lấy thông tin disk usage
     * @return Map chứa: totalSpace, usedSpace, freeSpace, backupSize, logSize, tempSize
     */
    Map<String, Object> getDiskUsage();

    /**
     * Tìm file trùng lặp
     * @return Danh sách nhóm file trùng
     */
    List<Map<String, Object>> findDuplicateFiles();

    /**
     * Lưu trữ (archive) log cũ
     * @param beforeDate Archive log trước ngày
     * @return SystemOptimizationLog
     */
    SystemOptimizationLog archiveLogs(LocalDateTime beforeDate);

    // ==================== HISTORY ====================

    /**
     * Lấy lịch sử optimization phân trang
     */
    Page<SystemOptimizationLog> getOptimizationHistory(Pageable pageable);
}
