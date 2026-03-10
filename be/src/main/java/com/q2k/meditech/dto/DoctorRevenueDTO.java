package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for doctor revenue breakdown
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorRevenueDTO {
    
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private String avatarUrl;
    
    // Revenue metrics
    private BigDecimal totalRevenue;
    private BigDecimal netRevenue; // After refunds
    private Long transactionCount;
    private BigDecimal averageFee;
    
    // Refund metrics
    private BigDecimal refundAmount;
    private Long refundCount;
    
    // Appointment metrics
    private Long completedAppointments;
    private Long cancelledAppointments;
    
    // Performance
    private Double revenuePercentage; // % of total revenue
    private Integer rank; // Ranking among doctors
}
