package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for doctor appointment statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorStatsDTO {
    
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private String avatarUrl;
    
    private Long totalAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    private Long noShowAppointments;
    
    private BigDecimal completionRate;
    private BigDecimal cancellationRate;
    private BigDecimal noShowRate;
    
    private BigDecimal averageRating;
    private Integer totalReviews;
    
    // Revenue (if applicable)
    private BigDecimal totalRevenue;
    private BigDecimal consultationFee;
    
    // Time metrics
    private BigDecimal averageWaitTime;     // minutes
    private BigDecimal averageConsultTime;  // minutes
}
