package com.q2k.meditech.entity.enums;

/**
 * Status enum for Prescription lifecycle.
 * <ul>
 *   <li>ACTIVE   – prescription is current and valid</li>
 *   <li>EXPIRED  – past the expiry date</li>
 *   <li>CANCELLED – voided by doctor or system</li>
 * </ul>
 */
public enum PrescriptionStatus {
    ACTIVE,
    EXPIRED,
    CANCELLED
}
