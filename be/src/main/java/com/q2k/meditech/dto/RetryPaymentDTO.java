package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO for retrying failed/pending payment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetryPaymentDTO {

    @NotNull(message = "Send via method is required")
    private String sendVia; // EMAIL, SMS, BOTH

    private String customMessage; // Optional custom message to include
}
