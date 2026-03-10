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
     * Lấy thông tin dashboard backup
     * @return Map chứa: lastBackup, nextScheduled, health, storageInfo
     */
    Map<String, Object> getDashboard();

    // ==================== HISTORY (FR-BACK-002) ====================

    /**
     * Lấy lịch sử backup có phân trang và lọc
     */
    Page<BackupRecord> getHistory(BackupType type, BackupStatus status,
                                   StorageLocation location,
                                   LocalDateTime startDate, LocalDateTime endDate,
                                   Pageable pageable);

    /**
     * Lấy chi tiết backup theo ID
     */
    BackupRecord getDetail(Long id);

    /**
     * Xác minh tính toàn vẹn backup (checksum)
     */
    Map<String, Object> verifyBackup(Long id);

    /**
     * Xóa backup
     */
    void deleteBackup(Long id);

    /**
     * Download file backup
     */
    Resource downloadBackup(Long id);

    // ==================== MANUAL BACKUP (FR-BACK-003) ====================

    /**
     * Chạy backup thủ công
     * @param backupName Tên backup
     * @param backupType Loại backup
     * @param includes Danh sách thành phần backup ["DATABASE","FILES","CONFIG"]
     * @param storageLocation Nơi lưu trữ
     * @param encrypted Có mã hóa không
     * @return BackupRecord đã tạo
     */
    BackupRecord runManualBackup(String backupName, BackupType backupType,
                                  List<String> includes, StorageLocation storageLocation,
                                  Boolean encrypted);

    /**
     * Lấy tiến trình backup đang chạy
     */
    BackupRecord getBackupProgress(Long id);

    /**
     * Hủy backup đang chạy
     */
    void cancelBackup(Long id);

    // ==================== SCHEDULE ====================

    /**
     * Lấy tất cả schedule
     */
    List<BackupSchedule> getSchedules();

    /**
     * Tạo schedule mới
     */
    BackupSchedule createSchedule(BackupSchedule schedule);

    /**
     * Cập nhật schedule
     */
    BackupSchedule updateSchedule(Long id, BackupSchedule schedule);

    /**
     * Xóa schedule
     */
    void deleteSchedule(Long id);

    /**
     * Bật/tắt schedule
     */
    BackupSchedule toggleSchedule(Long id, boolean enabled);
}
