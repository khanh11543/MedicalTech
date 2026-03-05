package com.q2k.meditech.entity.enums;

/**
 * Refund method (how refund is returned to patient)
 */
public enum RefundMethod {
    CASH,
    MOMO,
    BANK_TRANSFER,
    VNPAY,
    ZALOPAY,
    CARD,
    ORIGINAL_METHOD  // Refund to the same method used for payment
}
