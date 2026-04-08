package com.q2k.meditech.service;

import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventServiceTest {

    @Mock NotificationService notificationService;
    @Mock UserRepository userRepository;

    @InjectMocks NotificationEventService notificationEventService;

    private Appointment appt;
    private User admin;

    @BeforeEach
    void setUp() {
        User pu = User.builder().fullName("Pat").build();
        pu.setId(1L);
        User du = User.builder().fullName("Doc").build();
        du.setId(2L);
        Patient p = Patient.builder().user(pu).build();
        p.setId(10L);
        Doctor d = Doctor.builder().id(20L).user(du).build();
        appt = Appointment.builder()
                .patient(p)
                .doctor(d)
                .appointmentDate(LocalDate.of(2026, 4, 5))
                .startTime(java.time.LocalTime.of(10, 0))
                .queueNumber(3)
                .build();
        appt.setId(100L);
        admin = User.builder().build();
        admin.setId(99L);
        when(userRepository.findByRoles_NameIn(anyList())).thenReturn(List.of(admin));
    }

    @Test
    void onNewBooking_notifiesRecipients() {
        notificationEventService.onNewBooking(appt);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onAppointmentConfirmed_notifiesRecipients() {
        notificationEventService.onAppointmentConfirmed(appt);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onAppointmentCancelled_notifiesRecipients() {
        notificationEventService.onAppointmentCancelled(appt);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onAppointmentRescheduled_notifiesRecipients() {
        notificationEventService.onAppointmentRescheduled(appt);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onPatientCheckedIn_notifiesRecipients() {
        notificationEventService.onPatientCheckedIn(appt, 5, "201");
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onNoShowMarked_notifiesRecipients() {
        notificationEventService.onNoShowMarked(appt);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onDoctorNotified_sendsToDoctorUser() {
        notificationEventService.onDoctorNotified(appt, null);
        ArgumentCaptor<com.q2k.meditech.dto.CreateNotificationDTO> cap =
                ArgumentCaptor.forClass(com.q2k.meditech.dto.CreateNotificationDTO.class);
        verify(notificationService).createAndSend(cap.capture());
        assertThat(cap.getValue().getUserId()).isEqualTo(2L);
    }

    @Test
    void onMomoPaymentReceived_notifiesRecipients() {
        Payment pay = Payment.builder().paymentCode("P1").totalAmount(BigDecimal.TEN).build();
        pay.setId(1L);
        notificationEventService.onMomoPaymentReceived(pay);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onPaymentFailed_notifiesRecipients() {
        Payment pay = Payment.builder().paymentCode("P1").build();
        pay.setId(1L);
        notificationEventService.onPaymentFailed(pay);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onNewPendingPayment_notifiesRecipients() {
        Payment pay = Payment.builder().paymentCode("P1").totalAmount(BigDecimal.ONE).build();
        pay.setId(1L);
        notificationEventService.onNewPendingPayment(pay);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onOverduePayment_notifiesRecipients() {
        Payment pay = Payment.builder().paymentCode("P1").totalAmount(BigDecimal.ONE).build();
        pay.setId(1L);
        notificationEventService.onOverduePayment(pay);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onNewPatientRegistered_notifiesRecipients() {
        User u = User.builder().fullName("N").build();
        u.setId(5L);
        notificationEventService.onNewPatientRegistered(u);
        verify(notificationService, atLeastOnce()).createAndSend(any());
    }

    @Test
    void onPatientProfileUpdated_sendsToAdminsOnly() {
        when(userRepository.findByRoles_NameIn(List.of("ADMIN"))).thenReturn(List.of(admin));
        notificationEventService.onPatientProfileUpdated(5L, "Name");
        verify(notificationService).createAndSend(any());
    }

    @Test
    void onMaintenanceScheduled_sendsToAdmins() {
        when(userRepository.findByRoles_NameIn(List.of("ADMIN"))).thenReturn(List.of(admin));
        notificationEventService.onMaintenanceScheduled("window");
        verify(notificationService).createAndSend(any());
    }

    @Test
    void onBackupCompleted_sendsToAdmins() {
        when(userRepository.findByRoles_NameIn(List.of("ADMIN"))).thenReturn(List.of(admin));
        notificationEventService.onBackupCompleted("ok");
        verify(notificationService).createAndSend(any());
    }

    @Test
    void onSettingChanged_sendsToAdmins() {
        when(userRepository.findByRoles_NameIn(List.of("ADMIN"))).thenReturn(List.of(admin));
        notificationEventService.onSettingChanged("theme", "admin");
        verify(notificationService).createAndSend(any());
    }
}
