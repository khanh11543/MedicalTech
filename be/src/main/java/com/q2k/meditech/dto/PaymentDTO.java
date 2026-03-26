package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Payment response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDTO {
    
    private Long id;
    
    private String paymentCode;
    
    private Long appointmentId;
    
    private String appointmentCode;

    private Long prescriptionId;

    private String prescriptionCode;

    private String referenceType; // APPOINTMENT or PRESCRIPTION
    
    private Long patientId;
    
    private String patientName;
    
    private BigDecimal amount;
    
    private BigDecimal discountAmount;
    
    private BigDecimal taxAmount;
    
    private BigDecimal totalAmount;
    
    private String currency;
    
    private String paymentMethod; // CASH, MOMO
    
    private String paymentStatus; // PENDING, INITIATED, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED, EXPIRED
    
    private String transactionId;

    /**
     * Alias for transactionId - used by frontend as Transaction Code
     */
    public String getTransactionCode() {
        return transactionId;
    }

    /**
     * Alias for paymentStatus - used by frontend
     */
    public String getStatus() {
        return paymentStatus;
    }

    /**
     * Alias: frontend reads paymentDate (returns paidAt or createdAt)
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    public LocalDateTime getPaymentDate() {
        return paidAt != null ? paidAt : createdAt;
    }
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paidAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime refundedAt;
    
    private BigDecimal refundAmount;
    
    private String refundReason;
    
    private Long processedBy;
    
    private String processedByName;

    private String doctorName;

    /** Doctor specialty for display on patient portal (e.g. "Pediatrics") */
    private String doctorSpecialty;

    /** Appointment date for display on patient portal */
    private LocalDate appointmentDate;

    /** Appointment status (e.g. PENDING, COMPLETED, CANCELLED) */
    private String appointmentStatus;

    private BigDecimal amountReceived;

    private BigDecimal changeGiven;
    
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // QR info (if applicable)
    private PaymentQrDTO qrInfo;
}