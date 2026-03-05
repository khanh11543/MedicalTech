package com.q2k.meditech.exception;

import org.springframework.http.HttpStatus;

public class AppointmentException extends AppException {
    
    public AppointmentException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
    
    public AppointmentException(String message, HttpStatus status) {
        super(message, status);
    }
    
    // Specific appointment exceptions
    public static class TimeSlotConflictException extends AppointmentException {
        public TimeSlotConflictException() {
            super("The selected time slot is not available. Please choose another time.");
        }
    }
    
    public static class InvalidStatusTransitionException extends AppointmentException {
        public InvalidStatusTransitionException(String from, String to) {
            super(String.format("Cannot change appointment status from %s to %s", from, to));
        }
    }
    
    public static class AppointmentNotCancellableException extends AppointmentException {
        public AppointmentNotCancellableException() {
            super("This appointment cannot be cancelled.", HttpStatus.FORBIDDEN);
        }
    }
    
    public static class AppointmentNotReschedulableException extends AppointmentException {
        public AppointmentNotReschedulableException(String reason) {
            super(reason, HttpStatus.BAD_REQUEST);
        }
    }

    public static class PatientTimeConflictException extends AppointmentException {
        public PatientTimeConflictException() {
            super("Patient already has another appointment at the requested time.");
        }
    }

    public static class TimeSlotNotAvailableException extends AppointmentException {
        public TimeSlotNotAvailableException() {
            super("The selected time slot is not available (BLOCKED or already BOOKED).");
        }
    }

    public static class AppointmentAlreadyPassedException extends AppointmentException {
        public AppointmentAlreadyPassedException() {
            super("Cannot reschedule: the appointment time has already passed.");
        }
    }

    public static class RescheduleTooLateException extends AppointmentException {
        public RescheduleTooLateException(int hours) {
            super(String.format("Patients must reschedule at least %d hours before the appointment.", hours));
        }
    }

    public static class UnauthorizedAccessException extends AppointmentException {
        public UnauthorizedAccessException() {
            super("You are not authorized to access this appointment.", HttpStatus.FORBIDDEN);
        }
    }
}