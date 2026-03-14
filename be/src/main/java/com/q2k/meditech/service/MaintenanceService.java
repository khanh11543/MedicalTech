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
     * Get maintenance dashboard: current status, upcoming schedule
     */
    Map<String, Object> getMaintenanceDashboard();

    /**
     * Schedule maintenance
     * @param maintenanceWindow Maintenance info
     * @return Created MaintenanceWindow
     */
    MaintenanceWindow scheduleMaintenance(MaintenanceWindow maintenanceWindow);

    /**
     * Activate maintenance immediately
     * @param message Maintenance notification message
     * @param durationMinutes Maintenance duration (minutes)
     * @param whitelistedIps List of IPs allowed to access
     * @return Active MaintenanceWindow
     */
    MaintenanceWindow activateMaintenanceNow(String message, Integer durationMinutes,
                                              List<String> whitelistedIps);

    /**
     * Deactivate maintenance
     */
    MaintenanceWindow deactivateMaintenance(Long id);

    /**
     * Update maintenance window
     */
    MaintenanceWindow updateMaintenance(Long id, MaintenanceWindow maintenanceWindow);

    /**
     * Cancel scheduled maintenance
     */
    void cancelMaintenance(Long id);

    /**
     * Get paginated maintenance history
     */
    Page<MaintenanceWindow> getMaintenanceHistory(Pageable pageable);

    /**
     * Check if the system is in maintenance mode
     */
    boolean isMaintenanceActive();

    /**
     * Get active maintenance info (if any)
     */
    MaintenanceWindow getActiveMaintenance();

    /**
     * Get upcoming maintenance
     */
    List<MaintenanceWindow> getUpcomingMaintenance();

    /**
     * Get maintenance detail
     */
    MaintenanceWindow getMaintenanceDetail(Long id);
}
