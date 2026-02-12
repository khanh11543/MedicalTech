package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for mock webhook testing
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookMockDTO {
    
    @NotNull(message = "Payment ID is required")
    private Long paymentId;
    
    @NotNull(message = "Result code is required")
    private Integer resultCode; // 0 = success, others = fail
    
    @Pattern(regexp = "^(success|failed|cancelled)$", message = "Status must be success, failed, or cancelled")
    private String status;
    
    private String message;
    
    private String transactionId;
}