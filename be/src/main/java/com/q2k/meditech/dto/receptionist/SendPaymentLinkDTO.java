package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for sending payment link to patient (Tab 5.3)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendPaymentLinkDTO {

    /**
     * How to send: EMAIL, SMS, BOTH
     */
    @NotNull(message = "Send via method is required")
    @Pattern(regexp = "^(EMAIL|SMS|BOTH)$", message = "sendVia must be EMAIL, SMS, or BOTH")
    private String sendVia;

    /**
     * Optional custom message to include
     */
    private String customMessage;
}
