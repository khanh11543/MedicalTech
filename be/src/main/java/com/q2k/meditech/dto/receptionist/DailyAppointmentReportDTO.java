package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for Daily Appointments Report (Tab 6.1).
 * Used for printing the day's appointment list and shift handover.
 * No DOB, address, diagnosis, or notes — receptionist privacy scope.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyAppointmentReportDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate reportDate;

    private String generatedBy;       // Receptionist full name
    private String branch;            // Clinic / branch name

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;

    // --- Summary section ---
    private SummarySection summary;

    // --- Detailed appointment list ---
    private List<AppointmentRow> appointments;

    // ==================== Inner DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummarySection {
        private int totalAppointments;
        private int confirmed;
        private int checkedIn;
        private int inProgress;
        private int completed;
        private int cancelled;
        private int noShow;
        private int pending;
        private int rescheduled;
        /** completionRate = completed / (total − cancelled − rescheduled) × 100 */
        private double completionRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentRow {
        private String appointmentCode;

        @JsonFormat(pattern = "HH:mm")
        private LocalTime startTime;

        @JsonFormat(pattern = "HH:mm")
        private LocalTime endTime;

        private String patientName;
        private String maskedPhone;     // e.g. 0901***567

        private String doctorName;
        private String room;            // doctor.currentRoom
        private String status;
        private Integer queueNumber;
        private String paymentStatus;   // PENDING / PAID / etc.
    }
}
