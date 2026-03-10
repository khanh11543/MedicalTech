package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Statistics response DTO for Security Events dashboard (10.1).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEventStatsDTO {
    // Summary counts
    private long totalEvents;
    private long highSeverityCount;
    private long mediumSeverityCount;
    private long lowSeverityCount;
    private long newCount;
    private long reviewedCount;
    private long resolvedCount;

    // Breakdown
    private List<TypeCountDTO> byEventType;
    private List<SeverityCountDTO> bySeverity;
    private List<DateCountDTO> byDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TypeCountDTO {
        private String eventType;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeverityCountDTO {
        private String severity;
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
}
