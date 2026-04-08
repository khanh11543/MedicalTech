package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.ReorderQueueDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorTodayServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AuditLogRepository auditLogRepository;
    @Mock UserRepository userRepository;
    @Mock MedicalRecordRepository medicalRecordRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks DoctorTodayService service;

    @Test
    void getTodayData_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getTodayData(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void callNextPatient_alreadyInProgress() {
        Appointment inProg = Appointment.builder().status(AppointmentStatus.IN_PROGRESS).build();
        when(appointmentRepository.findByDoctorIdAndDateForDashboard(eq(1L), any()))
                .thenReturn(List.of(inProg));
        assertThatThrownBy(() -> service.callNextPatient(1L, 9L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void callPatient_appointmentNotFound() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.callPatient(1L, 9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void completeConsultation_notFound() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.completeConsultation(1L, 9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void skipPatient_notFound() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.skipPatient(1L, 9L, "r", 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markNoShow_notFound() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.markNoShow(1L, 9L, "r", 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void changeDoctorStatus_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.changeDoctorStatus(1L, "AVAILABLE", 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reorderQueue_appointmentNotInQueue() {
        when(appointmentRepository.findQueuedByDoctorAndDate(eq(1L), any(), any())).thenReturn(List.of());
        assertThatThrownBy(() -> service.reorderQueue(1L, ReorderQueueDTO.builder()
                .orderedAppointmentIds(List.of(99L))
                .reason("test")
                .build(), 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void sendToReception_notFound() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.sendToReception(1L, 9L, "msg", 1L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
