package com.q2k.meditech.service;

import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service interface for Maintenance operations (FR-BACK-005)
 */
public interface MaintenanceService {

    /**
     * Lấy dashboard bảo trì: trạng thái hiện tại, lịch sắp tới
     */
    Map<String, Object> getMaintenanceDashboard();

    /**
     * Lên lịch bảo trì
     * @param maintenanceWindow Thông tin bảo trì
     * @return MaintenanceWindow đã tạo
     */
    MaintenanceWindow scheduleMaintenance(MaintenanceWindow maintenanceWindow);

    /**
     * Kích hoạt bảo trì ngay lập tức
     * @param message Thông báo bảo trì
     * @param durationMinutes Thời gian bảo trì (phút)
     * @param whitelistedIps Danh sách IP được phép truy cập
     * @return MaintenanceWindow đang active
     */
    MaintenanceWindow activateMaintenanceNow(String message, Integer durationMinutes,
                                              List<String> whitelistedIps);

    /**
     * Hủy kích hoạt bảo trì
     */
    MaintenanceWindow deactivateMaintenance(Long id);

    /**
     * Cập nhật maintenance window
     */
    MaintenanceWindow updateMaintenance(Long id, MaintenanceWindow maintenanceWindow);

    /**
     * Hủy maintenance đã lên lịch
     */
    void cancelMaintenance(Long id);

    /**
     * Lấy lịch sử bảo trì phân trang
     */
    Page<MaintenanceWindow> getMaintenanceHistory(Pageable pageable);

    /**
     * Kiểm tra hệ thống có đang trong chế độ bảo trì không
     */
    boolean isMaintenanceActive();

    /**
     * Lấy thông tin maintenance đang active (nếu có)
     */
    MaintenanceWindow getActiveMaintenance();

    /**
     * Lấy maintenance sắp tới
     */
    List<MaintenanceWindow> getUpcomingMaintenance();

    /**
     * Lấy chi tiết maintenance
     */
    MaintenanceWindow getMaintenanceDetail(Long id);
}
