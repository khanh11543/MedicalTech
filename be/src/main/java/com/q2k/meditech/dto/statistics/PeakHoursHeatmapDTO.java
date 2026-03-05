package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for peak hours heatmap data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeakHoursHeatmapDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    
    /**
     * 7 days x 24 hours matrix
     * days[0] = Sunday, days[1] = Monday, ..., days[6] = Saturday
     * Each day contains 24 hour slots (0-23)
     */
    private List<DayData> days;
    
    // Peak info
    private PeakInfo peakHour;
    private PeakInfo peakDay;
    
    private Long maxCount;
    private Long totalAppointments;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayData {
        private String dayName;     // SUNDAY, MONDAY, etc.
        private String dayShort;    // SUN, MON, etc.
        private Integer dayIndex;   // 0-6
        private List<HourCount> hours;
        private Long dayTotal;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourCount {
        private Integer hour;       // 0-23
        private String hourLabel;   // "08:00", "09:00", etc.
        private Long count;
        private Double intensity;   // 0.0 - 1.0 for heatmap coloring
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PeakInfo {
        private String label;       // e.g., "Monday 10:00" or "Wednesday"
        private Long count;
        private Double percentage;
    }
}
