package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for cancellation analysis
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationAnalysisDTO {
    
    private LocalDate from;
    private LocalDate to;
    private Long doctorId;
    
    // Overall stats
    private Long totalCancellations;
    private Long totalAppointments;
    private BigDecimal cancellationRate;
    
    // Cancellation by initiator
    private Long cancelledByPatient;
    private Long cancelledByDoctor;
    private Long cancelledByAdmin;
    private Long cancelledBySystem;
    
    // Cancellation reasons breakdown
    private List<ReasonCount> topReasons;
    
    // Trend over time
    private List<TrendPoint> trend;
    
    // Time-based analysis
    private BigDecimal avgHoursBeforeAppointment;  // How early cancellations happen
    private Long lastMinuteCancellations;          // Within 2 hours of appointment
    private Long sameDayCancellations;
    private Long advanceCancellations;             // More than 24 hours before
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReasonCount {
        private String reason;
        private Long count;
        private BigDecimal percentage;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private String label;
        private LocalDate date;
        private Long cancellations;
        private Long totalBooked;
        private BigDecimal rate;
    }
}
