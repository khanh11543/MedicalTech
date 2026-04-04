package com.q2k.meditech.event;

/**
 * Published after a new appointment is persisted and the booking transaction commits.
 * Heavy work (MoMo init, confirmation email prep) runs asynchronously in a listener.
 */
public record AppointmentBookedEvent(Long appointmentId, Long bookedByUserId, Long paymentId) {}
