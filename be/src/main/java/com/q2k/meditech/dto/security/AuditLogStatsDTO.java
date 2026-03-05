package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Statistics response DTO for Audit Trail dashboard (10.3).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogStatsDTO {
    // Summary counts
    private long totalLogs;
    private long sensitiveAccessCount;
    private long deleteCount;

    // Breakdown
    private List<ActionTypeCountDTO> byActionType;
    private List<EntityTypeCountDTO> byEntityType;
    private List<DateCountDTO> byDate;
    private List<HeatmapEntryDTO> heatmap;    // activity heatmap (dayOfWeek x hour)
    private List<ActiveUserDTO> mostActiveUsers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionTypeCountDTO {
        private String actionType;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityTypeCountDTO {
        private String entityType;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DateCountDTO {
        private String date;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HeatmapEntryDTO {
        private int dayOfWeek;     // 1=Sunday, 7=Saturday
        private int hour;          // 0-23
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActiveUserDTO {
        private Long userId;
        private String fullName;
        private long actionCount;
    }
}
