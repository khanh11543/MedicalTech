package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.RefundStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for comprehensive refund detail
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDetailDTO {
    
    // Refund Info
    private Long id;
    private String refundCode;
    private RefundStatus status;
    private String refundReason;
    private String refundReasonType; // RefundReason enum name
    private String refundMethod;     // RefundMethod enum name
    private String refundType;       // AUTO or MANUAL
    private Boolean urgent;
    private Integer retryCount;
    private Integer maxRetries;
    
    // Amount Info
    private BigDecimal refundAmount;
    private BigDecimal originalAmount;
    private String currency;
    private BigDecimal refundPercentage; // Percentage of original amount
    
    // Payment Info
    private Long paymentId;
    private String paymentCode;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime paymentDate;
    private String transactionId;
    
    // Patient Info
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    
    // Doctor Info
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    
    // Appointment Info
    private Long appointmentId;
    private String appointmentCode;
    private LocalDateTime appointmentDate;
    private String appointmentStatus;
    
    // Request Info
    private LocalDateTime requestedDate;
    private Long requestedById;
    private String requestedByName;
    
    // Approval Info
    private LocalDateTime approvedDate;
    private Long approvedById;
    private String approvedByName;
    
    // Processing Info
    private LocalDateTime processedDate;
    private Long processedById;
    private String processedByName;
    private String transactionReference;
    private String gatewayRefundId;
    private String processingNotes;
    
    // Evidence (manual/cash refunds)
    private String evidenceUrl;
    private Boolean cashierConfirmed;
    private String workstationId;
    
    // Rejection Info
    private LocalDateTime rejectedDate;
    private Long rejectedById;
    private String rejectedByName;
    private String rejectionReason;
    
    // Notes
    private String notes;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // History timeline
    private List<RefundHistoryEvent> history;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundHistoryEvent {
        private Long id;
        private String eventType;
        private String description;
        private String previousStatus;
        private String newStatus;
        private Long performedById;
        private String performedByName;
        private LocalDateTime eventTime;
    }
}
