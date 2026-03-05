package com.q2k.meditech.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for marking payment as paid with cash
 * Includes cash handling fields: amountReceived, changeGiven, receipt options
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkCashDTO {

    /**
     * Amount received from patient (must be >= total amount due)
     */
    @DecimalMin(value = "0", message = "Amount received must be >= 0")
    private BigDecimal amountReceived;

    /**
     * Change given back to patient (auto-calculated: amountReceived - totalAmount)
     * If provided, used as-is; if null, calculated by backend
     */
    private BigDecimal changeGiven;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    private String transactionId; // Optional manual transaction reference

    /**
     * Whether to print a physical receipt (default: true)
     */
    @Builder.Default
    private Boolean printReceipt = true;

    /**
     * Whether to email receipt to patient (default: true if patient has email)
     */
    @Builder.Default
    private Boolean emailReceipt = true;

    /**
     * Whether to send receipt via SMS (default: false)
     */
    @Builder.Default
    private Boolean smsReceipt = false;
}