package com.q2k.meditech.dto;

import lombok.*;

import java.util.Map;

/**
 * DTO for appointment statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatsDTO {
    
    // Summary counts
    private Long todayTotal;
    private Long weekTotal;
    private Long monthTotal;
    
    // Today's breakdown
    private Long todayPending;
    private Long todayConfirmed;
    private Long todayCheckedIn;
    private Long todayCompleted;
    private Long todayCancelled;
    private Long todayNoShow;
    
    // Rates
    private Double completionRate;      // completed / total
    private Double cancellationRate;    // cancelled / total
    private Double noShowRate;          // no_show / total
    
    // Trends (for charts)
    private Map<String, Long> dailyTrend;       // Last 7 days: date -> count
    private Map<String, Long> statusBreakdown;  // status -> count
    private Map<String, Long> doctorBreakdown;  // doctorName -> count (top 10)
    private Map<String, Long> hourlyDistribution; // hour -> count
    
    // Peak hours
    private String peakHour;
    private Long peakHourCount;
    
    // Average wait time (if available)
    private Double avgWaitTimeMinutes;
    
    // Comparison with previous period
    private Double weekOverWeekChange;    // percentage
    private Double monthOverMonthChange;  // percentage
}
