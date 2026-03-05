package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for receptionist to send a template-based message to a patient.
 * Unlike admin's CustomMessageDTO, this restricts to template-only (no free text).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendTemplateMessageDTO {

    @NotBlank(message = "Channel is required")
    @Pattern(regexp = "EMAIL|SMS", message = "Channel must be EMAIL or SMS")
    private String channel;

    /** The template ID to send. Required — receptionist cannot compose free text. */
    @NotBlank(message = "Template ID is required")
    private String templateId;
}
