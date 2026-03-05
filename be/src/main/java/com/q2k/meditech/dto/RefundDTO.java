package com.q2k.meditech.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for payment refund request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDTO {

    @NotNull(message = "Refund amount is required")
    @DecimalMin(value = "0.01", message = "Refund amount must be positive")
    private BigDecimal refundAmount;

    @NotNull(message = "Refund reason is required")
    private String refundReason;

    /**
     * Standardized reason type: PATIENT_CANCELLED_WITHIN_POLICY, DOCTOR_CANCELLED,
     * DUPLICATE_PAYMENT, PAYMENT_ERROR, CHARGED_TWICE, SERVICE_NOT_PROVIDED,
     * DISPUTE_RESOLUTION, OTHER
     */
    private String refundReasonType;

    /**
     * Refund method: CASH, MOMO, BANK_TRANSFER, VNPAY, ZALOPAY, CARD, ORIGINAL_METHOD
     */
    private String refundMethod;

    /**
     * Refund type: AUTO (gateway) or MANUAL (cash/manual transfer)
     */
    @Builder.Default
    private String refundType = "MANUAL";

    private String notes;

    // For MoMo refunds (optional)
    private String transactionId; // Original transaction ID
    private String description; // Refund description for gateway
}