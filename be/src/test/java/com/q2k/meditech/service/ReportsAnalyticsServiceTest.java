package com.q2k.meditech.service;

import com.q2k.meditech.dto.ReportsAnalyticsDTO;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportsAnalyticsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private SpecialtyRepository specialtyRepository;

    @InjectMocks
    private ReportsAnalyticsService service;

    @Test
    void getReportsAnalytics_emptyData() {
        when(appointmentRepository.findAll()).thenReturn(List.of());
        when(paymentRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());
        when(doctorRepository.findAll()).thenReturn(List.of());
        when(specialtyRepository.findAll()).thenReturn(List.of());

        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        ReportsAnalyticsDTO dto = service.getReportsAnalytics(from, to);

        assertThat(dto.getTotalUsers()).isZero();
        assertThat(dto.getGeneratedAt()).isNotNull();
    }
}
