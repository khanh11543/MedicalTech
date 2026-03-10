package com.q2k.meditech.dto.receptionist;

import lombok.*;

import java.math.BigDecimal;

/**
 * Aggregated dashboard statistics for receptionist view.
 * Combines appointment, check-in, queue, and payment summaries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionistDashboardStatsDTO {

    // ========== APPOINTMENTS ==========
    private Long todayTotalAppointments;
    private Long pendingAppointments;
    private Long confirmedAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;

    // ========== CHECK-IN ==========
    private Long checkedInCount;
    private Long awaitingCheckIn;       // CONFIRMED but not yet checked in
    private Long inProgressCount;       // IN_PROGRESS (with doctor)

    // ========== QUEUE ==========
    private Long totalInQueue;          // CHECKED_IN patients waiting
    private Integer activeDoctors;      // Doctors with appointments today
    private Double avgWaitTimeMinutes;

    // ========== NO-SHOW ==========
    private Long noShowCount;
    private Long overdueCount;          // Past start time but not checked in / no-showed

    // ========== PAYMENTS ==========
    private BigDecimal todayRevenue;
    private Long pendingPayments;
    private BigDecimal pendingPaymentAmount;
    private Long completedPayments;
}
