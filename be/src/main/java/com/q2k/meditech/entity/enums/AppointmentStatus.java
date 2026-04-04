package com.q2k.meditech.entity.enums;

public enum AppointmentStatus {
    PENDING,      // Pending confirmation
    SCHEDULED,    // Scheduled - The clinic has confirmed the appointment ad waiting for the patient's confirmation
    CONFIRMED,    // Confirmed  - The patient has confirmed the appointment
    CHECKED_IN,   // Checked in - The patient has checked in at the clinic
    IN_PROGRESS,  // In progress - The appointment is currently in progress
    AWAITING_SERVICE_RESULTS, // Waiting for lab or ancillary service results before completion
    COMPLETED,    // Completed - The appointment has been completed successfully
    CANCELLED,    // Cancelled - The appointment has been cancelled by either the patient or the clinic
    NO_SHOW,      // No show - The patient did not show up for the appointment without prior notice
    RESCHEDULED   // Rescheduled - The appointment has been rescheduled to a different date/time
}