package com.q2k.meditech.service;

import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import com.q2k.meditech.entity.enums.MaintenanceType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MaintenanceWindowRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceWindowRepository maintenanceWindowRepository;
    private final UserRepository userRepository;

    @Override
    public Map<String, Object> getMaintenanceDashboard() {
        log.info("Getting maintenance dashboard");
        Map<String, Object> dashboard = new LinkedHashMap<>();

        // Current status
        boolean isActive = isMaintenanceActive();
        dashboard.put("isActive", isActive);

        MaintenanceWindow activeMaintenance = getActiveMaintenance();
        dashboard.put("activeMaintenance", activeMaintenance);

        // Upcoming schedule
        List<MaintenanceWindow> upcoming = getUpcomingMaintenance();
        dashboard.put("upcomingSchedule", upcoming);

        // Stats
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalScheduled", maintenanceWindowRepository.findByStatus(MaintenanceStatus.SCHEDULED).size());
        stats.put("totalCompleted", maintenanceWindowRepository.findByStatus(MaintenanceStatus.COMPLETED).size());
        stats.put("totalCancelled", maintenanceWindowRepository.findByStatus(MaintenanceStatus.CANCELLED).size());
        dashboard.put("stats", stats);

        return dashboard;
    }

    @Override
    @Transactional
    public MaintenanceWindow scheduleMaintenance(MaintenanceWindow maintenanceWindow) {
        log.info("Scheduling maintenance: {}", maintenanceWindow.getTitle());

        // Validate times
        if (maintenanceWindow.getStartTime() == null || maintenanceWindow.getEndTime() == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (maintenanceWindow.getStartTime().isAfter(maintenanceWindow.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }
        if (maintenanceWindow.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Start time must be in the future");
        }

        maintenanceWindow.setStatus(MaintenanceStatus.SCHEDULED);
        if (maintenanceWindow.getMaintenanceType() == null) {
            maintenanceWindow.setMaintenanceType(MaintenanceType.SCHEDULED);
        }
        maintenanceWindow.setCreatedBy(getCurrentUser());

        MaintenanceWindow saved = maintenanceWindowRepository.save(maintenanceWindow);
        log.info("Maintenance scheduled: {} (ID: {})", saved.getTitle(), saved.getId());
        return saved;
    }

    @Override
    @Transactional
    public MaintenanceWindow activateMaintenanceNow(String message, Integer durationMinutes,
                                                     List<String> whitelistedIps) {
        log.info("Activating maintenance now, duration: {} minutes", durationMinutes);

        // Kiểm tra có maintenance đang active không
        if (isMaintenanceActive()) {
            throw new BadRequestException("Maintenance is already active");
        }

        LocalDateTime now = LocalDateTime.now();
        int duration = durationMinutes != null ? durationMinutes : 60;

        MaintenanceWindow maintenance = MaintenanceWindow.builder()
                .title("Emergency Maintenance")
                .maintenanceType(MaintenanceType.EMERGENCY)
                .status(MaintenanceStatus.ACTIVE)
                .startTime(now)
                .endTime(now.plusMinutes(duration))
                .actualStartTime(now)
                .message(message != null ? message : "System is under maintenance. Please try again later.")
                .allowAdminAccess(true)
                .whitelistedIps(whitelistedIps != null ? String.join(",", whitelistedIps) : null)
                .createdBy(getCurrentUser())
                .build();

        MaintenanceWindow saved = maintenanceWindowRepository.save(maintenance);
        log.info("Maintenance activated: ID={}, until {}", saved.getId(), saved.getEndTime());
        return saved;
    }

    @Override
    @Transactional
    public MaintenanceWindow deactivateMaintenance(Long id) {
        log.info("Deactivating maintenance ID: {}", id);

        MaintenanceWindow maintenance = maintenanceWindowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceWindow", "id", id));

        if (maintenance.getStatus() != MaintenanceStatus.ACTIVE) {
            throw new BadRequestException("Can only deactivate active maintenance windows");
        }

        maintenance.setStatus(MaintenanceStatus.COMPLETED);
        maintenance.setActualEndTime(LocalDateTime.now());

        MaintenanceWindow saved = maintenanceWindowRepository.save(maintenance);
        log.info("Maintenance deactivated: {}", saved.getTitle());
        return saved;
    }

    @Override
    @Transactional
    public MaintenanceWindow updateMaintenance(Long id, MaintenanceWindow updated) {
        MaintenanceWindow existing = maintenanceWindowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceWindow", "id", id));

        if (existing.getStatus() == MaintenanceStatus.COMPLETED || existing.getStatus() == MaintenanceStatus.CANCELLED) {
            throw new BadRequestException("Cannot update completed or cancelled maintenance");
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setMaintenanceType(updated.getMaintenanceType());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setMessage(updated.getMessage());
        existing.setNotifyBeforeMinutes(updated.getNotifyBeforeMinutes());
        existing.setAllowAdminAccess(updated.getAllowAdminAccess());
        existing.setWhitelistedIps(updated.getWhitelistedIps());
        existing.setImpact(updated.getImpact());
        existing.setAffectedServices(updated.getAffectedServices());

        return maintenanceWindowRepository.save(existing);
    }

    @Override
    @Transactional
    public void cancelMaintenance(Long id) {
        MaintenanceWindow maintenance = maintenanceWindowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceWindow", "id", id));

        if (maintenance.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel completed maintenance");
        }

        maintenance.setStatus(MaintenanceStatus.CANCELLED);
        maintenanceWindowRepository.save(maintenance);
        log.info("Maintenance cancelled: {}", maintenance.getTitle());
    }

    @Override
    public Page<MaintenanceWindow> getMaintenanceHistory(Pageable pageable) {
        return maintenanceWindowRepository.findHistory(pageable);
    }

    @Override
    public boolean isMaintenanceActive() {
        return maintenanceWindowRepository.existsByStatus(MaintenanceStatus.ACTIVE);
    }

    @Override
    public MaintenanceWindow getActiveMaintenance() {
        List<MaintenanceWindow> activeList = maintenanceWindowRepository.findByStatus(MaintenanceStatus.ACTIVE);
        return activeList.isEmpty() ? null : activeList.get(0);
    }

    @Override
    public List<MaintenanceWindow> getUpcomingMaintenance() {
        return maintenanceWindowRepository.findUpcoming(LocalDateTime.now());
    }

    @Override
    public MaintenanceWindow getMaintenanceDetail(Long id) {
        return maintenanceWindowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenanceWindow", "id", id));
    }

    // ==================== HELPER ====================

    private User getCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }
}
