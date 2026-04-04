package com.q2k.meditech.event;

import com.q2k.meditech.service.AppointmentBookingFollowUpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AppointmentBookedEventListener {

    private final AppointmentBookingFollowUpService appointmentBookingFollowUpService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAppointmentBooked(AppointmentBookedEvent event) {
        appointmentBookingFollowUpService.runFollowUp(
                event.appointmentId(),
                event.bookedByUserId(),
                event.paymentId());
    }
}
