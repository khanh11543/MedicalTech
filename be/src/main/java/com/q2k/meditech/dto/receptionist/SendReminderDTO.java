package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for sending a template-based reminder for a single appointment.
 * Receptionist can only use pre-defined templates, no free text.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendReminderDTO {

    @NotBlank(message = "Channel is required")
    @Pattern(regexp = "EMAIL|SMS", message = "Channel must be EMAIL or SMS")
    private String channel;

    /** Template ID to use. If null, uses system default reminder template. */
    private String templateId;
}
