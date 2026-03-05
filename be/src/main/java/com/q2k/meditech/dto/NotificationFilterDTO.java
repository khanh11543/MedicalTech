package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter DTO for querying notifications.
 * Used as query parameters in GET /api/me/notifications
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationFilterDTO {

    /**
     * Filter by high-level type: APPOINTMENT, PAYMENT, PATIENT, SYSTEM
     * null = all types
     */
    private NotificationType type;

    /**
     * Filter by priority: INFO, IMPORTANT, URGENT
     * null = all priorities
     */
    private NotificationPriority priority;

    /**
     * Show only unread notifications
     */
    @Builder.Default
    private Boolean unreadOnly = false;

    @Builder.Default
    private Integer pageNumber = 0;

    @Builder.Default
    private Integer pageSize = 20;
}
