package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Lightweight response for unread notification counts.
 * Used for the badge on the notification bell icon.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnreadCountResponse {

    /**
     * Total unread notifications
     */
    private Long total;

    /**
     * Unread count per type: { "APPOINTMENT": 3, "PAYMENT": 1, ... }
     */
    private Map<String, Long> byType;
}
