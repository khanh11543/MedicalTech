package com.q2k.meditech.entity.enums;

/**
 * Enum for Time Slot status
 * Transition rules:
 *   AVAILABLE → BOOKED  (appointment created)
 *   AVAILABLE → BLOCKED (admin blocks)
 *   BOOKED    → COMPLETED (appointment completed)
 *   BLOCKED   → AVAILABLE (admin unblocks)
 *   AVAILABLE → RESERVED (hold while payment/confirm in progress)
 *   RESERVED  → BOOKED   (payment confirmed)
 *   RESERVED  → AVAILABLE (hold expired / cancelled)
 */
public enum TimeSlotStatus {
    AVAILABLE,   // Slot is open for booking
    BOOKED,      // Slot has been booked by a patient
    BLOCKED,     // Slot is blocked (vacation, meeting, etc.)
    COMPLETED,   // Appointment completed
    RESERVED     // Temporarily held (payment/confirm pending)
}
