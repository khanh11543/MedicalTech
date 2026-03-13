package com.q2k.meditech.entity.enums;

/**
 * Notification priority level
 * URGENT: red highlight, sound, requires "Acknowledge"
 *   - Patient waiting > 30 min
 *   - Overdue payment (> 3 days)
 */
public enum NotificationPriority {
    INFO,       // General information
    IMPORTANT,  // Important
    URGENT      // Urgent — red, sound, require acknowledge
}
