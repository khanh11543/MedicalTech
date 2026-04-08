package com.q2k.meditech.service;

import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Room;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.ReviewRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorDashboardServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock ReviewRepository reviewRepository;
    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository userRepository;

    @InjectMocks DoctorDashboardService doctorDashboardService;

    @Test
    void getDashboard_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> doctorDashboardService.getDashboard(1L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDashboard_buildsDto() {
        Room room = Room.builder().id(1L).roomNumber("201").name("A").build();
        Doctor doctor = Doctor.builder().id(5L).fullName("D").room(room)
                .ratingAvg(BigDecimal.valueOf(45, 1)).ratingCount(10).build();
        when(doctorRepository.findById(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorIdAndDateForDashboard(eq(5L), any(LocalDate.class)))
                .thenReturn(List.of());
        User dashUser = User.builder().fullName("FromUser").build();
        dashUser.setId(9L);
        when(userRepository.findById(9L)).thenReturn(Optional.of(dashUser));
        when(reviewRepository.countByDoctorIdAndCreatedAtAfter(eq(5L), any())).thenReturn(0L);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(9L), any()))
                .thenReturn(new PageImpl<>(List.of()));
        when(notificationRepository.countByUserIdAndIsRead(9L, false)).thenReturn(0L);
        when(appointmentRepository.countByDoctorIdAndDateRange(eq(5L), any(), any())).thenReturn(0L);
        when(appointmentRepository.countByDoctorIdAndStatusAndDateRange(eq(5L), eq(AppointmentStatus.NO_SHOW), any(), any()))
                .thenReturn(0L);

        var dto = doctorDashboardService.getDashboard(5L, 9L);

        assertThat(dto.getDoctorId()).isEqualTo(5L);
        assertThat(dto.getDoctorName()).isEqualTo("FromUser");
        assertThat(dto.getRoomNumber()).isEqualTo("201");
    }
}
