package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Dashboard display preferences for a receptionist user.
 * Stored per-user to customize the dashboard layout.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardPreferencesDTO {

    @Builder.Default
    private Boolean showAppointmentStats = true;

    @Builder.Default
    private Boolean showQueueStatus = true;

    @Builder.Default
    private Boolean showPaymentSummary = true;

    @Builder.Default
    private Boolean showUpcomingAppointments = true;

    @Builder.Default
    private Boolean showPendingActions = true;

    @Builder.Default
    private Boolean showNoShowAlerts = true;

    @Builder.Default
    private Integer upcomingAppointmentsLimit = 5;

    @Builder.Default
    private Integer refreshIntervalSeconds = 30;

    @Builder.Default
    private String defaultDateRange = "TODAY"; // TODAY, WEEK, MONTH
}
