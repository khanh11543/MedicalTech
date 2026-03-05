package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Summary of pending actions for the receptionist dashboard.
 * Shows counts of items that need attention.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingActionsDTO {

    private Long needConfirmation;      // PENDING appointments for today
    private Long awaitingCheckIn;       // CONFIRMED but not checked in yet
    private Long overdueAppointments;   // Past start time, CONFIRMED but not checked-in
    private Long pendingPayments;       // Payments with PENDING status
    private Long inQueueCount;          // CHECKED_IN, waiting for doctor
    private Long noShowCandidates;      // Overdue > threshold (e.g. 15 min), not yet marked NO_SHOW
}
