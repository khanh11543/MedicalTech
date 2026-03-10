package com.q2k.meditech.entity.enums;

/**
 * Enum for refund request statuses
 * Lifecycle: REQUESTED → APPROVED → PROCESSING → COMPLETED / FAILED
 *            REQUESTED → REJECTED
 */
public enum RefundStatus {
    REQUESTED,    // Refund requested, awaiting approval
    APPROVED,     // Approved, ready to process
    PENDING,      // Legacy alias (mapped to REQUESTED)
    PROCESSING,   // Refund being processed via gateway or manual
    COMPLETED,    // Refund successfully completed
    FAILED,       // Refund failed (retryable)
    REJECTED      // Refund request rejected
}
