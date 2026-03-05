package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for sending custom message to patient
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomMessageDTO {

    /**
     * Type of message: EMAIL or SMS
     */
    @NotBlank(message = "Message type is required")
    @Pattern(regexp = "EMAIL|SMS", message = "Message type must be EMAIL or SMS")
    private String messageType;

    /**
     * Subject (required for EMAIL)
     */
    private String subject;

    /**
     * Message content
     */
    @NotBlank(message = "Message content is required")
    private String message;

    /**
     * Send a copy to admin/sender
     */
    @Builder.Default
    private Boolean sendCopy = false;

    /**
     * Copy recipient email (if sendCopy is true)
     */
    private String copyRecipient;
}
