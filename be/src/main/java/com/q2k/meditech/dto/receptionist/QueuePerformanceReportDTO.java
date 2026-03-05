package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Queue Performance Report (Tab 6.3).
 * Today-only — operational monitoring.
 * Patient phone is masked.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueuePerformanceReportDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate reportDate;

    private String generatedBy;
    private String branch;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;

    // --- Overall metrics ---
    private int totalCheckedIn;
    private double avgWaitMinutes;       // avg wait from check-in to consultation start
    private double longestWaitMinutes;
    private double noShowRate;           // percentage 0–100
    private int noShowCount;
    private int totalScheduled;          // denominator for no-show rate

    // --- By Doctor ---
    private List<DoctorPerformance> byDoctor;

    // ==================== Inner DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorPerformance {
        private Long doctorId;
        private String doctorName;
        private String room;
        private int patientsServed;      // COMPLETED count
        private int patientsWaiting;     // CHECKED_IN count
        private double avgWaitMinutes;
        private double longestWaitMinutes;
        private String peakHour;         // e.g. "09:00 - 10:00"
    }
}
