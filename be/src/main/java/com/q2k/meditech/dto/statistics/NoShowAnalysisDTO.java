package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for no-show analysis
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoShowAnalysisDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    
    // Overall stats
    private Long totalNoShows;
    private Long totalScheduled;        // Total that should have attended
    private BigDecimal noShowRate;
    
    // Comparison
    private BigDecimal previousPeriodRate;
    private BigDecimal rateChange;
    
    // Trend over time
    private List<TrendPoint> trend;
    
    // By day of week
    private List<DayBreakdown> byDayOfWeek;
    
    // By time of day
    private List<TimeBreakdown> byTimeOfDay;
    
    // Repeat offenders
    private Long uniqueNoShowPatients;
    private Long repeatOffenders;       // Patients with 2+ no-shows
    private List<RepeatOffender> topRepeatOffenders;
    
    // Financial impact (estimated)
    private BigDecimal estimatedRevenueLoss;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private String label;
        private LocalDate date;
        private Long noShows;
        private Long scheduled;
        private BigDecimal rate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayBreakdown {
        private String dayName;
        private Long noShows;
        private Long total;
        private BigDecimal rate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeBreakdown {
        private String timeSlot;    // "08:00-10:00", "10:00-12:00", etc.
        private Long noShows;
        private Long total;
        private BigDecimal rate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RepeatOffender {
        private Long patientId;
        private String patientName;
        private String phone;
        private Integer noShowCount;
        private LocalDate lastNoShowDate;
    }
}
