package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Comprehensive appointment detail DTO for receptionist view.
 * Contains aggregated information: patient (masked), doctor, payment, allowed actions.
 * Does NOT include raw medical data (symptoms, prescriptions, medical records).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionistAppointmentDetailDTO {

    // === Header ===
    private Long id;
    private String appointmentCode;
    private AppointmentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByName;
    private BookedBy bookedBy;

    // === Patient Card (privacy-safe) ===
    private PatientCard patient;

    // === Appointment Card ===
    private AppointmentCard appointment;

    // === Doctor Card ===
    private DoctorCard doctor;

    // === Payment Card ===
    private PaymentCard payment;

    // === Allowed actions based on current status ===
    private List<String> allowedActions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientCard {
        private Long id;
        private String name;
        private String maskedPhone;
        private String email;           // may be partially masked
        private String mrn;             // Medical Record Number (if exists)
        private String gender;
        private LocalDate dateOfBirth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentCard {
        private LocalDate appointmentDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer durationMinutes;
        private String type;            // CONSULTATION, FOLLOW_UP, EMERGENCY, CHECKUP
        private AppointmentStatus status;
        private Integer queueNumber;
        private String reasonCategory;  // Category only, not free text
        private String adminNotes;      // Staff-facing notes
        private LocalDateTime checkedInAt;
        private String cancellationReason; // Why cancelled/no-show
        private String cancelledByName;    // Who cancelled
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorCard {
        private Long id;
        private String name;
        private String specialization;
        private String room;
        private BigDecimal consultationFee;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentCard {
        private Long paymentId;
        private BigDecimal fee;
        private String paymentStatus;   // PENDING, PAID, CANCELLED
        private String paymentMethod;   // CASH, MOMO, etc.
        private String receiptUrl;
        private LocalDateTime paidAt;
    }
}
