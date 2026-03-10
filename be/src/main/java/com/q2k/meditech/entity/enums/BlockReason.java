package com.q2k.meditech.entity.enums;

/**
 * Predefined reasons for blocking a time slot
 */
public enum BlockReason {
    VACATION,
    MEETING,
    EMERGENCY,
    TRAINING,
    PERSONAL,
    HOLIDAY,        // Auto-blocked by holiday rule
    OTHER
}
