package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for revenue breakdown by appointment type
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentTypeRevenueDTO {
    
    private BigDecimal totalRevenue;
    private Long totalAppointments;
    
    // Breakdown by type
    private List<TypeBreakdown> types;
    
    // Period info
    private String fromDate;
    private String toDate;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TypeBreakdown {
        private String appointmentType; // CONSULTATION, FOLLOW_UP, EMERGENCY, etc.
        private String displayName;
        private BigDecimal revenue;
        private Long appointmentCount;
        private Double percentage; // % of total revenue
        private BigDecimal averageFee;
        
        // Completion metrics
        private Long completedCount;
        private Long cancelledCount;
        private Double completionRate;
    }
}
