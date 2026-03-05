package com.q2k.meditech.service;

import java.util.List;
import java.util.Map;

/**
 * Service interface for low-level Database operations (mysqldump, restore, etc.)
 */
public interface DatabaseService {

    /**
     * Thực hiện mysqldump để backup database
     * @param outputPath Đường dẫn file output
     * @param options Tùy chọn bổ sung
     * @return Đường dẫn file backup đã tạo
     */
    String executeMySQLDump(String outputPath, Map<String, Object> options);

    /**
     * Khôi phục database từ file dump
     * @param filePath Đường dẫn file backup
     */
    void restoreFromDump(String filePath);

    /**
     * Lấy thống kê các bảng trong database
     * @return Danh sách thông tin bảng: name, rows, dataSize, indexSize, dataFree
     */
    List<Map<String, Object>> getTableStats();

    /**
     * Lấy thông tin phân mảnh database
     * @return Danh sách bảng bị phân mảnh và mức độ
     */
    List<Map<String, Object>> getFragmentationInfo();

    /**
     * Optimize (OPTIMIZE TABLE) cho tất cả bảng
     * @return Kết quả optimize cho từng bảng
     */
    List<Map<String, Object>> optimizeAllTables();

    /**
     * Analyze (ANALYZE TABLE) cho tất cả bảng
     * @return Kết quả analyze cho từng bảng
     */
    List<Map<String, Object>> analyzeAllTables();

    /**
     * Lấy kích thước database
     * @return Kích thước tính bằng bytes
     */
    Long getDatabaseSize();

    /**
     * Lấy danh sách tên tất cả bảng
     */
    List<String> getAllTableNames();

    /**
     * Kiểm tra kết nối database
     * @return true nếu database hoạt động bình thường
     */
    boolean checkConnection();
}
