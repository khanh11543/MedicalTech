package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.NotificationCategory;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO used by NotificationEventService to create notifications.
 * NOT exposed in REST API — used only within the service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNotificationDTO {

    private Long userId;

    private String title;

    private String message;

    private NotificationType type;

    private NotificationCategory category;

    @Builder.Default
    private NotificationPriority priority = NotificationPriority.INFO;

    /**
     * Reference entity type (e.g. "APPOINTMENT", "PAYMENT", "USER")
     */
    private String referenceType;

    /**
     * Reference entity ID
     */
    private Long referenceId;
}
