package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for Backup Dashboard (FR-BACK-001)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupDashboardDTO {

    // ========== LAST BACKUP ==========
    private LastBackupInfo lastBackup;

    // ========== NEXT SCHEDULED ==========
    private NextScheduledInfo nextScheduled;

    // ========== HEALTH ==========
    private HealthInfo health;

    // ========== STORAGE ==========
    private StorageInfo storageInfo;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LastBackupInfo {
        private Long id;
        private String backupName;
        private String backupType;
        private String status;
        private Long size;
        private String sizeFormatted;
        private Long duration;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime completedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NextScheduledInfo {
        private Long scheduleId;
        private String scheduleName;
        private String backupType;
        private String cronExpression;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime nextRunAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HealthInfo {
        private String status; // HEALTHY, WARNING, NO_BACKUP
        private Long completedCount;
        private Long failedCount;
        private Long inProgressCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StorageInfo {
        private String location;
        private Long totalBackupSize;
        private String totalBackupSizeFormatted;
        private Long totalSpace;
        private Long freeSpace;
        private Long usableSpace;
        private Integer usagePercent;
    }
}
