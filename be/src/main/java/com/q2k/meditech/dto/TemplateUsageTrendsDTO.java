package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for template usage trends over time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateUsageTrendsDTO {

    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String groupBy; // DAY, WEEK, MONTH

    private List<TrendDataPoint> trendData;

    private Long totalPrescriptions;
    private Double averagePrescriptionsPerPeriod;
    private TrendDataPoint peakPeriod;

    /**
     * Individual data point in the trend
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataPoint {
        private String period; // Date or date range label
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private Long prescriptionCount;
        private Long medicationCount;
        private Long uniquePatients;
        private Long uniqueDoctors;
    }
}
