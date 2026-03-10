package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.RefundStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for refund list responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundResponseDTO {
    
    private Long id;
    private String refundCode;
    
    // Payment info
    private Long paymentId;
    private String paymentCode;
    private String paymentMethod;
    
    // Amount info
    private BigDecimal refundAmount;
    private BigDecimal originalAmount;
    private String currency;
    
    // Status
    private RefundStatus status;
    private String refundReason;
    private String refundReasonType; // RefundReason enum name
    private String refundMethod;     // RefundMethod enum name
    private String refundType;       // AUTO or MANUAL
    private Boolean urgent;
    private Integer retryCount;
    
    // Approval info
    private LocalDateTime approvedDate;
    private Long approvedById;
    private String approvedByName;
    
    // Patient info
    private Long patientId;
    private String patientName;
    private String patientEmail;
    
    // Doctor info
    private Long doctorId;
    private String doctorName;
    
    // Appointment info
    private Long appointmentId;
    private String appointmentCode;
    
    // Request info
    private LocalDateTime requestedDate;
    private Long requestedById;
    private String requestedByName;
    
    // Processing info
    private LocalDateTime processedDate;
    private Long processedById;
    private String processedByName;
    private String transactionReference;
    
    // Rejection info
    private LocalDateTime rejectedDate;
    private Long rejectedById;
    private String rejectedByName;
    private String rejectionReason;
    
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
