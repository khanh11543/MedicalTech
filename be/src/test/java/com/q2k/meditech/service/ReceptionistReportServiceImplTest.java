package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.DailyAppointmentReportDTO;
import com.q2k.meditech.dto.receptionist.DailyRevenueReportDTO;
import com.q2k.meditech.dto.receptionist.QueuePerformanceReportDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionistReportServiceImplTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private PrivacyMaskingService privacyMaskingService;

    @InjectMocks
    private ReceptionistReportServiceImpl service;

    @Test
    void getDailyAppointmentReport() {
        User pu = User.builder().fullName("P").phone("1").build();
        pu.setId(1L);
        Patient patient = Patient.builder().user(pu).fullName("P").build();
        patient.setId(1L);
        User du = User.builder().fullName("D").build();
        du.setId(2L);
        Doctor doctor = Doctor.builder().user(du).fullName("D").currentRoom("R1").build();
        doctor.setId(1L);
        Appointment a = Appointment.builder()
                .patient(patient).doctor(doctor)
                .appointmentDate(LocalDate.now()).appointmentTime(java.time.LocalTime.NOON)
                .startTime(java.time.LocalTime.NOON).endTime(java.time.LocalTime.NOON.plusHours(1))
                .bookedBy(com.q2k.meditech.entity.enums.BookedBy.PATIENT)
                .status(AppointmentStatus.CONFIRMED).appointmentCode("C").queueNumber(1)
                .build();
        a.setId(10L);

        when(appointmentRepository.findByDateWithDetailsForReport(any(), isNull())).thenReturn(List.of(a));
        java.util.List<Object[]> statusRows = new java.util.ArrayList<>();
        statusRows.add(new Object[]{AppointmentStatus.CONFIRMED, 1L});
        when(appointmentRepository.countByStatusOnDate(any(), isNull())).thenReturn(statusRows);
        when(paymentRepository.findByAppointmentIdWithDetails(10L)).thenReturn(Optional.empty());
        when(privacyMaskingService.maskPhone(any())).thenReturn("***");

        try (MockedStatic<com.q2k.meditech.util.SecurityUtil> su = mockStatic(com.q2k.meditech.util.SecurityUtil.class)) {
            su.when(com.q2k.meditech.util.SecurityUtil::getCurrentUserId).thenReturn(null);
            DailyAppointmentReportDTO r = service.getDailyAppointmentReport(LocalDate.now(), null);
            assertThat(r.getAppointments()).hasSize(1);
        }
    }

    @Test
    void getDailyRevenueReport() {
        when(paymentRepository.findPaidPaymentsForDate(any(), any())).thenReturn(List.of());
        when(paymentRepository.findAllPendingWithCompletedAppointments()).thenReturn(List.of());
        try (MockedStatic<com.q2k.meditech.util.SecurityUtil> su = mockStatic(com.q2k.meditech.util.SecurityUtil.class)) {
            su.when(com.q2k.meditech.util.SecurityUtil::getCurrentUserId).thenReturn(null);
            DailyRevenueReportDTO r = service.getDailyRevenueReport(LocalDate.now());
            assertThat(r.getTotalRevenue().signum()).isZero();
        }
    }

    @Test
    void getQueuePerformanceReport() {
        when(appointmentRepository.findQueuePerformanceData(any())).thenReturn(List.of());
        when(appointmentRepository.countByStatusOnDate(any(), isNull())).thenReturn(List.of());
        try (MockedStatic<com.q2k.meditech.util.SecurityUtil> su = mockStatic(com.q2k.meditech.util.SecurityUtil.class)) {
            su.when(com.q2k.meditech.util.SecurityUtil::getCurrentUserId).thenReturn(null);
            QueuePerformanceReportDTO r = service.getQueuePerformanceReport();
            assertThat(r.getByDoctor()).isEmpty();
        }
    }
}
