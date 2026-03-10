package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentSettingsDTO {

    // Booking Rules
    private int maxAdvanceBookingDays;
    private int defaultDurationMinutes;
    private boolean allowSameDayBooking;
    private boolean requireConfirmation;

    // Cancellation Policy
    private boolean enableCancellationPolicy;
    private int cancellationDeadlineHours;
    private String cancellationFeeType; // percentage, fixed, none
    private double cancellationFeeAmount;
    private String cancellationApplyTo; // all, patient, both

    // Rescheduling Policy
    private boolean enableReschedulingPolicy;
    private int maxReschedules;
    private int reschedulingDeadlineHours;

    // No-Show Policy
    private int noShowAfterMinutes;
    private double noShowFee;
    private int blockAfterNoShows;

    // Reminders
    private boolean emailReminderEnabled;
    private int emailReminderHoursBefore;
    private boolean smsReminderEnabled;
    private int smsReminderHoursBefore;
    private boolean pushReminderEnabled;
    private int pushReminderHoursBefore;
}
