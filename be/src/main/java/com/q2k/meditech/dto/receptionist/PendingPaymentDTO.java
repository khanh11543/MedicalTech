package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for pending payment list (Tab 5.3 — Công nợ)
 * Appointments COMPLETED but payment still PENDING
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingPaymentDTO {

    private Long paymentId;
    private String paymentCode;

    // Appointment info
    private Long appointmentId;
    private String appointmentCode;
    private String appointmentStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    // Patient info (masked)
    private Long patientId;
    private String patientName;
    private String maskedPhone;
    private String email;

    // Doctor info
    private String doctorName;

    // Payment info
    private BigDecimal amountDue;
    private String currency;

    // Pending tracking
    private Long daysPending;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastReminderSent;

    private Integer reminderCount;
    private String urgencyLevel; // NORMAL, REMINDER_1, REMINDER_2, URGENT, ESCALATED

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
