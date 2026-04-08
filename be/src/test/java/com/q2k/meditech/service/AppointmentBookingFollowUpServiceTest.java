package com.q2k.meditech.service;

import com.q2k.meditech.dto.PaymentInitDTO;
import com.q2k.meditech.dto.settings.GeneralSettingsDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentBookingFollowUpServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock PaymentService paymentService;
    @Mock EmailService emailService;
    @Mock SystemSettingService systemSettingService;

    @InjectMocks AppointmentBookingFollowUpService followUpService;

    @Test
    void runFollowUp_appointmentMissing_returnsEarly() {
        when(appointmentRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        followUpService.runFollowUp(1L, 2L, null);
        verify(paymentRepository, never()).findById(any());
    }

    @Test
    void runFollowUp_withEmail_sendsConfirmation() {
        User u = User.builder().email("a@b.com").fullName("U").build();
        u.setId(10L);
        Patient p = Patient.builder().user(u).fullName("P").build();
        p.setId(1L);
        User du = User.builder().fullName("Dr").build();
        du.setId(11L);
        Doctor d = Doctor.builder().id(2L).user(du).specialization("S").fullName("Dr X").build();
        Appointment appt = Appointment.builder()
                .patient(p)
                .doctor(d)
                .appointmentDate(LocalDate.of(2026, 4, 5))
                .startTime(LocalTime.of(9, 0))
                .appointmentCode("APT-1")
                .reasonForVisit("check")
                .build();
        appt.setId(5L);

        when(appointmentRepository.findByIdWithDetails(5L)).thenReturn(Optional.of(appt));
        when(systemSettingService.getGeneralSettings()).thenReturn(GeneralSettingsDTO.builder()
                .clinicName("C").phone("1").build());

        followUpService.runFollowUp(5L, 99L, null);

        verify(emailService).sendAppointmentConfirmationEmail(
                eq("a@b.com"), anyString(), eq("APT-1"), eq("S"), anyString(),
                anyString(), anyString(), eq("check"), eq("C"), eq("1"), isNull(),
                isNull(), isNull(), isNull());
    }

    @Test
    void runFollowUp_initializesMomoWhenPaymentPositive() {
        User u = User.builder().email("a@b.com").fullName("U").build();
        u.setId(10L);
        Patient p = Patient.builder().user(u).fullName("P").build();
        p.setId(1L);
        Appointment appt = Appointment.builder()
                .patient(p)
                .doctor(Doctor.builder().id(2L).specialization("S").build())
                .appointmentDate(LocalDate.of(2026, 4, 5))
                .startTime(LocalTime.of(9, 0))
                .appointmentCode("APT-1")
                .reasonForVisit("r")
                .build();
        appt.setId(5L);
        Payment pay = Payment.builder().totalAmount(new BigDecimal("1000")).build();
        pay.setId(8L);

        when(appointmentRepository.findByIdWithDetails(5L)).thenReturn(Optional.of(appt));
        when(paymentRepository.findById(8L)).thenReturn(Optional.of(pay));
        when(paymentService.initMomoPayment(eq(8L), any(), eq(99L)))
                .thenReturn(PaymentInitDTO.builder().success(true).build());
        when(systemSettingService.getGeneralSettings()).thenReturn(new GeneralSettingsDTO());

        followUpService.runFollowUp(5L, 99L, 8L);

        verify(paymentService).initMomoPayment(eq(8L), any(), eq(99L));
    }
}
