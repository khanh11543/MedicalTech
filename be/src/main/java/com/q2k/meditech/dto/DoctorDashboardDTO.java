package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for Doctor Dashboard overview.
 * Security: No symptoms/diagnosis exposed. Only counts, slots, and times.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDashboardDTO {

    // ===== Card 1: Today's Appointments =====
    private TodayAppointmentsCard todayAppointments;

    // ===== Card 2: Patients Waiting =====
    private PatientsWaitingCard patientsWaiting;

    // ===== Card 3: In Progress =====
    private InProgressCard inProgress;

    // ===== Card 4: Upcoming (Next 2 hours) =====
    private UpcomingCard upcoming;

    // ===== Card 5: No-show Rate (This week) =====
    private NoShowRateCard noShowRate;

    // ===== Card 6: Rating =====
    private RatingCard rating;

    // ===== Panel: Next Patient =====
    private NextPatientPanel nextPatient;

    // ===== Panel: Recent Notifications (last 5) =====
    private List<NotificationItem> notifications;
    private Long unreadNotificationCount;

    // ===== Quick Actions =====
    private QuickActionsData quickActions;

    // Metadata
    private LocalDateTime generatedAt;
    private Long doctorId;
    private String doctorName;

    // ==========================================
    // Inner DTOs for each card
    // ==========================================

    /**
     * Card 1: Today's Appointments
     * Total + breakdown by status
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TodayAppointmentsCard {
        private Long total;
        private Long pending;
        private Long confirmed;
        private Long checkedIn;
        private Long inProgress;
        private Long completed;
        private Long cancelled;
        private Long noShow;
        private Long rescheduled;
    }

    /**
     * Card 2: Patients Waiting
     * Count of patients with CHECKED_IN status, avg wait time, alert if > 30 min
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientsWaitingCard {
        private Long waitingCount;
        private Double avgWaitTimeMinutes;
        private Long maxWaitTimeMinutes;
        private Boolean hasLongWaitAlert;
        private Long longWaitCount;
    }

    /**
     * Card 3: In Progress
     * Current examination: 0/1, timer, appointment ID
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InProgressCard {
        private Boolean isExamining;
        private Long currentAppointmentId;
        private String currentPatientName;
        private LocalTime startedAt;
        private Long elapsedMinutes;
        private LocalTime scheduledStartTime;
        private LocalTime scheduledEndTime;
    }

    /**
     * Card 4: Upcoming (Next 2 hours)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpcomingCard {
        private Long count;
        private NextAppointmentInfo nextAppointment;
    }

    /**
     * Minimal info about the next appointment (no PHI)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NextAppointmentInfo {
        private Long appointmentId;
        private String patientName;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer queueNumber;
    }

    /**
     * Card 5: No-show Rate (This week)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NoShowRateCard {
        private Double noShowRatePercent;
        private Long noShowCount;
        private Long totalWeekAppointments;
    }

    /**
     * Card 6: Rating
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RatingCard {
        private BigDecimal averageRating;
        private Integer totalReviews;
        private Long recentReviewsCount;
    }

    /**
     * Panel: Next Patient — the next CHECKED_IN patient in queue
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NextPatientPanel {
        private Long appointmentId;
        private String patientName;
        private Integer age;
        private String gender;
        private String appointmentCode;
        private Integer queueNumber;
        private LocalTime startTime;
        private LocalTime endTime;
        private String status;
        private String reasonForVisit;
    }

    /**
     * A single notification item
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationItem {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String referenceType;
        private Long referenceId;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    /**
     * Quick Actions data — counts for action buttons
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuickActionsData {
        private Long pendingConfirmations;
        private Long checkedInCount;
        private Long todayTotal;
    }
}
