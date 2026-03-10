package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ActivateMaintenanceDTO;
import com.q2k.meditech.dto.MaintenanceWindowCreateDTO;
import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.service.MaintenanceService;
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

import java.util.List;
import java.util.Map;

/**
 * Maintenance Controller
 * Base path: /api/admin/maintenance
 *
 * APIs for maintenance window management: dashboard, schedule, activate, history
 * All endpoints require ADMIN role
 *
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/maintenance")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Maintenance Management", description = "APIs for managing maintenance windows and system downtime")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    // ==================== DASHBOARD (FR-BACK-005) ====================

    /**
     * GET /api/admin/maintenance/dashboard
     * Get maintenance dashboard overview
     */
    @GetMapping("/dashboard")
    @Operation(
        summary = "Get maintenance dashboard",
        description = "Get maintenance dashboard including active status, upcoming schedules and statistics"
    )
    public ResponseEntity<Map<String, Object>> getDashboard() {
        log.info("GET /admin/maintenance/dashboard");
        Map<String, Object> dashboard = maintenanceService.getMaintenanceDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/admin/maintenance/status
     * Check if system is in maintenance mode
     */
    @GetMapping("/status")
    @Operation(
        summary = "Check maintenance status",
        description = "Check if the system is currently in maintenance mode"
    )
    public ResponseEntity<Map<String, Object>> getMaintenanceStatus() {
        log.info("GET /admin/maintenance/status");
        boolean isActive = maintenanceService.isMaintenanceActive();
        MaintenanceWindow activeMaintenance = isActive
                ? maintenanceService.getActiveMaintenance()
                : null;

        return ResponseEntity.ok(Map.of(
                "isMaintenanceActive", isActive,
                "activeMaintenance", activeMaintenance != null ? activeMaintenance : Map.of()
        ));
    }

    // ==================== SCHEDULE ====================

    /**
     * POST /api/admin/maintenance/schedule
     * Schedule a new maintenance window
     */
    @PostMapping("/schedule")
    @Operation(
        summary = "Schedule maintenance",
        description = "Schedule a new maintenance window with start/end time and notification settings"
    )
    public ResponseEntity<MaintenanceWindow> scheduleMaintenance(
            @RequestBody MaintenanceWindowCreateDTO dto) {

        log.info("POST /admin/maintenance/schedule - title: {}, type: {}, start: {}",
                dto.getTitle(), dto.getMaintenanceType(), dto.getStartTime());

        MaintenanceWindow window = MaintenanceWindow.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .maintenanceType(dto.getMaintenanceType())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .message(dto.getMessage())
                .notifyBeforeMinutes(dto.getNotifyBeforeMinutes())
                .allowAdminAccess(dto.getAllowAdminAccess())
                .whitelistedIps(dto.getWhitelistedIps() != null ? String.join(",", dto.getWhitelistedIps()) : null)
                .impact(dto.getImpact())
                .affectedServices(dto.getAffectedServices())
                .build();

        MaintenanceWindow created = maintenanceService.scheduleMaintenance(window);
        return ResponseEntity.ok(created);
    }

    /**
     * POST /api/admin/maintenance/activate
     * Activate maintenance mode immediately (emergency)
     */
    @PostMapping("/activate")
    @Operation(
        summary = "Activate maintenance now",
        description = "Immediately activate maintenance mode for emergency maintenance"
    )
    public ResponseEntity<MaintenanceWindow> activateMaintenanceNow(
            @RequestBody ActivateMaintenanceDTO dto) {

        log.info("POST /admin/maintenance/activate - duration: {} min", dto.getDurationMinutes());

        MaintenanceWindow window = maintenanceService.activateMaintenanceNow(
                dto.getMessage(),
                dto.getDurationMinutes(),
                dto.getWhitelistedIps()
        );

        return ResponseEntity.ok(window);
    }

    /**
     * POST /api/admin/maintenance/{id}/deactivate
     * Deactivate maintenance mode
     */
    @PostMapping("/{id}/deactivate")
    @Operation(
        summary = "Deactivate maintenance",
        description = "End maintenance mode and restore normal system operation"
    )
    public ResponseEntity<MaintenanceWindow> deactivateMaintenance(
            @Parameter(description = "Maintenance window ID", required = true)
            @PathVariable Long id) {

        log.info("POST /admin/maintenance/{}/deactivate", id);
        MaintenanceWindow window = maintenanceService.deactivateMaintenance(id);
        return ResponseEntity.ok(window);
    }

    /**
     * PUT /api/admin/maintenance/{id}
     * Update a maintenance window
     */
    @PutMapping("/{id}")
    @Operation(
        summary = "Update maintenance window",
        description = "Update an existing scheduled maintenance window"
    )
    public ResponseEntity<MaintenanceWindow> updateMaintenance(
            @Parameter(description = "Maintenance window ID", required = true)
            @PathVariable Long id,
            @RequestBody MaintenanceWindowCreateDTO dto) {

        log.info("PUT /admin/maintenance/{} - title: {}", id, dto.getTitle());

        MaintenanceWindow window = MaintenanceWindow.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .maintenanceType(dto.getMaintenanceType())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .message(dto.getMessage())
                .notifyBeforeMinutes(dto.getNotifyBeforeMinutes())
                .allowAdminAccess(dto.getAllowAdminAccess())
                .whitelistedIps(dto.getWhitelistedIps() != null ? String.join(",", dto.getWhitelistedIps()) : null)
                .impact(dto.getImpact())
                .affectedServices(dto.getAffectedServices())
                .build();

        MaintenanceWindow updated = maintenanceService.updateMaintenance(id, window);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/admin/maintenance/{id}
     * Cancel a scheduled maintenance
     */
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Cancel maintenance",
        description = "Cancel a scheduled maintenance window"
    )
    public ResponseEntity<Map<String, String>> cancelMaintenance(
            @Parameter(description = "Maintenance window ID", required = true)
            @PathVariable Long id) {

        log.info("DELETE /admin/maintenance/{}", id);
        maintenanceService.cancelMaintenance(id);
        return ResponseEntity.ok(Map.of("message", "Maintenance cancelled successfully"));
    }

    // ==================== HISTORY & DETAIL ====================

    /**
     * GET /api/admin/maintenance/history
     * Get maintenance history
     */
    @GetMapping("/history")
    @Operation(
        summary = "Get maintenance history",
        description = "Get paginated history of completed and cancelled maintenance windows"
    )
    public ResponseEntity<Page<MaintenanceWindow>> getMaintenanceHistory(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "startTime") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/maintenance/history - page: {}, size: {}", pageNumber, pageSize);

        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<MaintenanceWindow> history = maintenanceService.getMaintenanceHistory(pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/admin/maintenance/upcoming
     * Get upcoming maintenance windows
     */
    @GetMapping("/upcoming")
    @Operation(
        summary = "Get upcoming maintenance",
        description = "Get list of upcoming scheduled maintenance windows"
    )
    public ResponseEntity<List<MaintenanceWindow>> getUpcomingMaintenance() {
        log.info("GET /admin/maintenance/upcoming");
        List<MaintenanceWindow> upcoming = maintenanceService.getUpcomingMaintenance();
        return ResponseEntity.ok(upcoming);
    }

    /**
     * GET /api/admin/maintenance/{id}
     * Get maintenance window detail
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get maintenance detail",
        description = "Get full maintenance window detail by ID"
    )
    public ResponseEntity<MaintenanceWindow> getMaintenanceDetail(
            @Parameter(description = "Maintenance window ID", required = true)
            @PathVariable Long id) {

        log.info("GET /admin/maintenance/{}", id);
        MaintenanceWindow window = maintenanceService.getMaintenanceDetail(id);
        return ResponseEntity.ok(window);
    }
}
