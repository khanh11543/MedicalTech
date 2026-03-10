package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for related records linked to an appointment
 * Includes prescriptions, payments, reviews
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RelatedRecordsDTO {

    private Long appointmentId;

    /**
     * Prescriptions linked to this appointment
     */
    private List<PrescriptionSummary> prescriptions;

    /**
     * Payments/invoices linked to this appointment
     */
    private List<PaymentSummary> payments;

    /**
     * Reviews for this appointment
     */
    private List<ReviewSummary> reviews;

    /**
     * Medical records created during this appointment
     */
    private List<MedicalRecordSummary> medicalRecords;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrescriptionSummary {
        private Long id;
        private LocalDate prescriptionDate;
        private String diagnosis;
        private String notes;
        private LocalDate followUpDate;
        private Boolean isActive;
        private Integer itemCount;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentSummary {
        private Long id;
        private String invoiceNumber;
        private BigDecimal amount;
        private BigDecimal paidAmount;
        private String status;  // PENDING, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED
        private String paymentMethod;
        private LocalDateTime paidAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewSummary {
        private Long id;
        private Integer rating;
        private String comment;
        private String doctorReply;
        private LocalDateTime repliedAt;
        private Boolean isVisible;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicalRecordSummary {
        private Long id;
        private String recordType;
        private String title;
        private String description;
        private LocalDateTime recordDate;
        private LocalDateTime createdAt;
    }
}
