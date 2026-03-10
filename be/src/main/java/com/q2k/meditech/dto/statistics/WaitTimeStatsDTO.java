package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for wait time statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitTimeStatsDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    
    // Overall wait time stats (in minutes)
    private BigDecimal averageWaitTime;
    private BigDecimal medianWaitTime;
    private BigDecimal minWaitTime;
    private BigDecimal maxWaitTime;
    private BigDecimal percentile90WaitTime;    // 90% of patients waited less than this
    
    // Consultation time stats (in minutes)
    private BigDecimal averageConsultTime;
    private BigDecimal medianConsultTime;
    
    // Wait time distribution
    private List<WaitTimeBucket> distribution;
    
    // Wait time by day of week
    private List<DayWaitTime> byDayOfWeek;
    
    // Wait time by hour
    private List<HourWaitTime> byHour;
    
    // Trend over time
    private List<TrendPoint> trend;
    
    // Service level
    private BigDecimal onTimeRate;              // % seen within 15 mins of scheduled time
    private BigDecimal under30MinRate;          // % seen within 30 mins
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaitTimeBucket {
        private String label;           // "0-5 min", "5-15 min", etc.
        private Integer minMinutes;
        private Integer maxMinutes;
        private Long count;
        private BigDecimal percentage;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayWaitTime {
        private String dayName;
        private BigDecimal averageWait;
        private Long appointmentCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourWaitTime {
        private Integer hour;
        private String hourLabel;
        private BigDecimal averageWait;
        private Long appointmentCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private String label;
        private LocalDate date;
        private BigDecimal averageWait;
        private Long appointmentCount;
    }
}
