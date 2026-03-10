package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for Doctor Today page (Queue / Timeline).
 * Covers the doctor's active work session for the current day.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorTodayDTO {

    // ===== Doctor status =====
    private String doctorStatus; // AVAILABLE, ON_BREAK, OFFLINE
    private Long doctorId;

    // ===== Current Patient (if examining) =====
    private CurrentPatient currentPatient;

    // ===== Waiting Queue =====
    private List<QueueItem> waitingQueue;

    // ===== Timeline items (all today's appointments) =====
    private List<TimelineItem> timeline;

    // ===== Summary counts =====
    private QueueSummary summary;

    // Metadata
    private LocalDateTime generatedAt;

    // =========================================================
    // Inner DTOs
    // =========================================================

    /**
     * Current patient being examined (IN_PROGRESS appointment).
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CurrentPatient {
        private Long appointmentId;
        private String appointmentCode;
        private Integer queueNumber;
        // Patient info (doctor view - no symptoms exposed in queue)
        private String patientName;
        private Integer age;
        private String gender;
        private String allergies;         // allergy alerts
        private String medicalHistory;    // chronic flags
        private String reasonForVisit;
        // Time tracking
        private LocalTime startedAt;      // actual start (updatedAt when status changed)
        private Long elapsedSeconds;      // live timer base
        private LocalTime scheduledStart;
        private LocalTime scheduledEnd;
    }

    /**
     * Single item in the waiting queue.
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class QueueItem {
        private Long appointmentId;
        private String appointmentCode;
        private Integer queueNumber;
        private String patientName;
        private Integer age;
        private LocalTime appointmentTime;     // scheduled start
        private LocalDateTime checkedInAt;
        private Long waitMinutes;              // live wait time
        private String status;                 // CHECKED_IN or CONFIRMED (called)
        private Boolean isEmergency;           // emergency flag
        private String waitLevel;              // NORMAL, WARNING (>20m), CRITICAL (>30m)
    }

    /**
     * Timeline view item – one per appointment.
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TimelineItem {
        private Long appointmentId;
        private String appointmentCode;
        private Integer queueNumber;
        private String patientName;
        private Integer age;
        private LocalTime startTime;
        private LocalTime endTime;
        private String status;          // raw AppointmentStatus name
        private String statusLabel;     // human friendly label
        private String statusColor;     // tailwind color hint: green/yellow/blue/red/gray
        private Boolean isCurrentSlot;  // overlaps current time
        private Boolean isNextSlot;     // first upcoming after now
        private String reasonForVisit;
        private Boolean needsFollowUp;  // placeholder – always false for now
    }

    /**
     * Summary counters for the queue header.
     */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class QueueSummary {
        private Long totalToday;
        private Long waiting;
        private Long completed;
        private Long noShow;
        private Long cancelled;
        private Long notCheckedIn;  // CONFIRMED but not checked in yet
        private Long inProgress;
    }
}
