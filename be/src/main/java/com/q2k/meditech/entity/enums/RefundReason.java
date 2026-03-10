package com.q2k.meditech.entity.enums;

/**
 * Standardized refund reasons
 */
public enum RefundReason {
    PATIENT_CANCELLED_WITHIN_POLICY,
    DOCTOR_CANCELLED,
    DUPLICATE_PAYMENT,
    PAYMENT_ERROR,
    CHARGED_TWICE,
    SERVICE_NOT_PROVIDED,
    DISPUTE_RESOLUTION,
    OTHER
}
