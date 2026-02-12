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
    
    private String notes;
    
    // For MoMo refunds (optional)
    private String transactionId; // Original transaction ID
    private String description; // Refund description for gateway
}