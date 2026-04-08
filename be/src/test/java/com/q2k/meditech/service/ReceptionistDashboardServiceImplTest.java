package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.AppointmentFilterDTO;
import com.q2k.meditech.dto.receptionist.DashboardPreferencesDTO;
import com.q2k.meditech.dto.receptionist.ReceptionistDashboardStatsDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.SystemSetting;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.SystemSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionistDashboardServiceImplTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private AppointmentService appointmentService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private SystemSettingRepository systemSettingRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private PrivacyMaskingService privacyMaskingService;

    @InjectMocks
    private ReceptionistDashboardServiceImpl service;

    @Test
    void getDashboardStats() {
        when(appointmentRepository.countAllStatusesOnDate(any())).thenReturn(List.of(
                new Object[]{AppointmentStatus.PENDING, 1L},
                new Object[]{AppointmentStatus.CONFIRMED, 2L}
        ));
        when(appointmentRepository.countDistinctDoctors(any(), any())).thenReturn(1L);
        when(appointmentRepository.findConfirmedAppointmentsByDate(any())).thenReturn(List.of());
        when(appointmentRepository.findCompletedWithTimestamps(any(), any(), isNull())).thenReturn(List.of());
        when(paymentRepository.sumAmountByStatusInDateRange(eq("PAID"), any(), any())).thenReturn(BigDecimal.TEN);
        when(paymentRepository.countCompletedInDateRange(any(), any())).thenReturn(1L);
        when(paymentRepository.countPendingPaymentsWithCompletedAppointment()).thenReturn(new Object[]{0L, BigDecimal.ZERO});

        ReceptionistDashboardStatsDTO s = service.getDashboardStats(LocalDate.now());
        assertThat(s.getTodayTotalAppointments()).isEqualTo(3L);
    }

    @Test
    void getTodayAppointments() {
        when(appointmentService.getAllAppointments(any(AppointmentFilterDTO.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertThat(service.getTodayAppointments("PENDING", 0, 10, "startTime", "ASC").getContent()).isEmpty();
    }

    @Test
    void getPreferences_default() {
        when(systemSettingRepository.findBySettingKey(anyString())).thenReturn(Optional.empty());
        assertThat(service.getPreferences(1L)).isNotNull();
    }

    @Test
    void updatePreferences_saves() throws Exception {
        DashboardPreferencesDTO dto = DashboardPreferencesDTO.builder().build();
        when(systemSettingRepository.findBySettingKey(anyString())).thenReturn(Optional.empty());
        when(objectMapper.writeValueAsString(dto)).thenReturn("{}");
        when(systemSettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.updatePreferences(1L, dto)).isSameAs(dto);
    }
}
