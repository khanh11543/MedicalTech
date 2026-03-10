package com.q2k.meditech.service;

import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.entity.enums.RestoreType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Service interface for Restore operations (FR-BACK-004)
 */
public interface RestoreService {

    /**
     * Khôi phục từ backup có sẵn trong hệ thống
     * @param backupId ID backup cần restore
     * @param restoreType Loại restore (FULL/PARTIAL/TEST)
     * @param items Danh sách thành phần cần restore
     * @param password Mật khẩu xác nhận
     * @return RestoreRecord
     */
    RestoreRecord restoreFromBackup(Long backupId, RestoreType restoreType,
                                     List<String> items, String password);

    /**
     * Khôi phục từ file upload
     * @param file File backup upload
     * @param restoreType Loại restore
     * @param items Danh sách thành phần cần restore
     * @param password Mật khẩu xác nhận
     * @return RestoreRecord
     */
    RestoreRecord restoreFromUpload(MultipartFile file, RestoreType restoreType,
                                     List<String> items, String password);

    /**
     * Lấy tiến trình restore đang chạy
     */
    RestoreRecord getRestoreProgress(Long id);

    /**
     * Chạy test restore (sandbox)
     * @param backupId ID backup cần test
     * @return RestoreRecord với kết quả test
     */
    RestoreRecord testRestore(Long backupId);

    /**
     * Lấy lịch sử restore phân trang
     */
    Page<RestoreRecord> getRestoreHistory(Pageable pageable);

    /**
     * Lấy chi tiết restore record
     */
    RestoreRecord getRestoreDetail(Long id);

    /**
     * Lấy thông tin tổng quan restore
     * @return Map chứa: totalRestores, lastRestore, activeRestores
     */
    Map<String, Object> getRestoreSummary();
}
