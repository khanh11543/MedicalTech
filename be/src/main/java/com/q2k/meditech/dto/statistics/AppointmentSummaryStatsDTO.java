package com.q2k.meditech.dto.statistics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for appointment summary statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentSummaryStatsDTO {
    
    private LocalDate from;
    private LocalDate to;
    
    // Total counts
    private Long totalAppointments;
    private Long pendingAppointments;
    private Long confirmedAppointments;
    private Long checkedInAppointments;
    private Long inProgressAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    private Long noShowAppointments;
    
    // Rates (percentages)
    private BigDecimal completionRate;      // completed / (total - pending - cancelled)
    private BigDecimal cancellationRate;    // cancelled / total
    private BigDecimal noShowRate;          // no_show / (confirmed + checked_in + completed + no_show)
    
    // Comparison with previous period (if applicable)
    private Long previousPeriodTotal;
    private BigDecimal changePercentage;    // (current - previous) / previous * 100
    
    // Average metrics
    private BigDecimal averageAppointmentsPerDay;
    private BigDecimal averageAppointmentsPerDoctor;
}
