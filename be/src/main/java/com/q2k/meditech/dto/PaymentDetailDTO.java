package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for comprehensive Payment details (admin view)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDetailDTO {

    // ========== TRANSACTION INFO ==========
    private Long id;
    private String paymentCode;
    private String paymentStatus;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paymentDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // ========== PAYMENT DETAILS ==========
    private BigDecimal amount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal transactionFee;
    private BigDecimal netAmount; // totalAmount - transactionFee
    private String currency;
    private String paymentMethod;

    // ========== PATIENT INFO ==========
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    // ========== DOCTOR INFO ==========
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    // ========== APPOINTMENT INFO ==========
    private Long appointmentId;
    private String appointmentCode;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime appointmentDate;
    
    private String appointmentType;
    private String appointmentStatus;

    // ========== PAYMENT GATEWAY INFO ==========
    private String gatewayName;
    private String gatewayTransactionId;
    private String gatewayStatus;
    private Object gatewayResponse;

    // ========== REFUND INFO ==========
    private Boolean isRefunded;
    private BigDecimal refundAmount;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime refundDate;
    
    private String refundReason;
    private String refundedByName;
    private String refundStatus;

    // ========== PROCESSING INFO ==========
    private Long processedBy;
    private String processedByName;
    private String notes;
    private String adminNotes;
    private String patientNotes;

    // ========== QR INFO ==========
    private PaymentQrDTO qrInfo;

    // ========== INVOICE INFO ==========
    private Long invoiceId;
    private String invoiceNumber;
    private String invoiceStatus;

    // ========== JSON Aliases for Frontend Compatibility ==========
    public String getTransactionCode() { return paymentCode; }
    public String getStatus() { return paymentStatus; }
    public LocalDateTime getCreatedDate() { return createdAt; }
    public LocalDateTime getLastUpdated() { return updatedAt; }
    public BigDecimal getTax() { return taxAmount; }
    public String getRefundedBy() { return refundedByName; }
}
