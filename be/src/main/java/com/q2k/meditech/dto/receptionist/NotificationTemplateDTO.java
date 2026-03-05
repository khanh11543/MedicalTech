package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * DTO for notification template metadata.
 * Receptionist can only use templates, not compose free text messages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplateDTO {

    private String id;
    private String name;
    private String channel;          // EMAIL, SMS
    private String category;         // REMINDER, CONFIRMATION, CANCELLATION, FOLLOW_UP
    private String contentPreview;   // First ~100 chars of template body
    private boolean active;
}
