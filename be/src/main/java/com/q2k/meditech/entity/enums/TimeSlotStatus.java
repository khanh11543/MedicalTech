package com.q2k.meditech.entity.enums;

/**
 * Enum for Time Slot status
 */
public enum TimeSlotStatus {
    AVAILABLE,  // Slot is available for booking
    BOOKED,     // Slot has been booked by a patient
    BLOCKED,    // Slot is blocked by doctor
    COMPLETED   // Appointment completed
}
