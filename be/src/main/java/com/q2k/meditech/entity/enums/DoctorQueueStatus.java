package com.q2k.meditech.entity.enums;

/**
 * Doctor status in queue management context.
 * Replaces the simple boolean isAvailable for richer queue workflows.
 */
public enum DoctorQueueStatus {
    AVAILABLE,   // Ready to receive patients
    BUSY,        // In consultation (auto-set when IN_PROGRESS)
    ON_BREAK,    // On break
    OFFLINE      // Not active today
}
