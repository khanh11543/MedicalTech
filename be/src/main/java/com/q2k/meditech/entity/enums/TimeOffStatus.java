package com.q2k.meditech.entity.enums;

public enum TimeOffStatus {
    PENDING_REVIEW, // Has conflict — waiting for admin/receptionist review
    APPROVED,       // Accepted and applied to availability
    REJECTED,       // Rejected by admin
    CANCELLED       // Doctor self-cancelled before taking effect
}
