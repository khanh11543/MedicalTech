package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for time series statistics (appointments over time)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSeriesStatsDTO {
    
    private LocalDate from;
    private LocalDate to;
    private String groupBy; // DAY, WEEK, MONTH
    private Long doctorId;
    
    private List<DataPoint> data;
    
    // Summary
    private Long totalAppointments;
    private Long maxInPeriod;
    private Long minInPeriod;
    private Double averagePerPeriod;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DataPoint {
        private String label;           // e.g., "2024-01-15", "Week 3", "January"
        private LocalDate date;         // Start date of period
        private Long total;
        private Long completed;
        private Long cancelled;
        private Long noShow;
    }
}
