package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Statistics response DTO for Investigation dashboard (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationStatsDTO {
    // Summary
    private long totalInvestigations;
    private long openCount;
    private long inProgressCount;
    private long resolvedCount;
    private long closedCount;
    private long overdueCount;

    // Breakdown
    private List<TypeCountDTO> byType;
    private List<SeverityCountDTO> bySeverity;
    private List<AssigneeCountDTO> byAssignee;

    // Performance
    private double avgResolutionDays;
    private long resolvedThisMonth;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TypeCountDTO {
        private String type;
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
    public static class AssigneeCountDTO {
        private Long userId;
        private String fullName;
        private long count;
    }
}
