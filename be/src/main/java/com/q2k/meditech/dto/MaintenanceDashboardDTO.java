package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Maintenance Dashboard (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceDashboardDTO {

    /** Current system status */
    private Boolean isMaintenanceActive;

    /** Active maintenance information */
    private ActiveMaintenanceInfo activeMaintenance;

    /** Upcoming maintenance */
    private List<UpcomingMaintenanceInfo> upcomingMaintenance;

    /** Statistics */
    private MaintenanceStatsInfo stats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActiveMaintenanceInfo {
        private Long id;
        private String title;
        private String message;
        private String maintenanceType;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime actualStartTime;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime endTime;

        /** Remaining time (minutes) */
        private Long remainingMinutes;
        private Boolean allowAdminAccess;
        private List<String> whitelistedIps;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpcomingMaintenanceInfo {
        private Long id;
        private String title;
        private String maintenanceType;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime startTime;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime endTime;

        private Long durationMinutes;
        private String impact;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MaintenanceStatsInfo {
        private Long totalScheduled;
        private Long totalCompleted;
        private Long totalCancelled;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime lastMaintenanceAt;
    }
}
