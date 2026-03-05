package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * DTO for bulk sending appointment reminders
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkReminderDTO {
    
    @NotEmpty(message = "At least one appointment ID is required")
    private List<Long> appointmentIds;
    
    /**
     * Type of message: EMAIL, SMS, PUSH, ALL
     */
    @Builder.Default
    private String messageType = "EMAIL";
    
    /**
     * Custom message content (optional)
     * If null, default reminder template will be used
     */
    private String customMessage;
    
    /**
     * Subject for email (optional)
     */
    private String emailSubject;
    
    /**
     * Whether to include appointment details in the message
     */
    @Builder.Default
    private Boolean includeDetails = true;
}
