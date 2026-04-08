package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QueueManagementServiceImplTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AppointmentService appointmentService;
    @Mock PrivacyMaskingService privacyMaskingService;

    @InjectMocks QueueManagementServiceImpl service;

    @Test
    void getQueueByDoctor_empty() {
        when(doctorRepository.findDoctorsWithAppointmentsOnDate(any())).thenReturn(List.of());
        assertThat(service.getQueueByDoctor()).isEmpty();
    }

    @Test
    void getQueueByRoom_empty() {
        when(doctorRepository.findDoctorsWithAppointmentsOnDate(any())).thenReturn(List.of());
        assertThat(service.getQueueByRoom()).isEmpty();
    }

    @Test
    void getAllQueuedPatients_empty() {
        when(appointmentRepository.findAllQueuedByDate(any(), any())).thenReturn(List.of());
        assertThat(service.getAllQueuedPatients(null, null)).isEmpty();
    }

    @Test
    void updateDoctorStatus_doctorNotFound() {
        when(doctorRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        var dto = UpdateDoctorStatusDTO.builder().status(DoctorQueueStatus.AVAILABLE).build();
        assertThatThrownBy(() -> service.updateDoctorStatus(1L, dto, 1L)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void getDoctorsList_empty() {
        when(doctorRepository.findDoctorsWithAppointmentsOnDate(any())).thenReturn(List.of());
        assertThat(service.getDoctorsList()).isEmpty();
    }

    @Test
    void reorderQueue_doctorNotFound() {
        when(doctorRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        var dto = ReorderQueueDTO.builder()
                .orderedAppointmentIds(List.of(1L))
                .reason("test")
                .build();
        assertThatThrownBy(() -> service.reorderQueue(1L, dto, 1L)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void addWalkIn_doctorNotFound() {
        when(doctorRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.addWalkIn(1L, AddWalkInDTO.builder().patientId(9L).build(), 1L))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void moveDoctor_appointmentNotFound() {
        when(appointmentRepository.findByIdWithDetails(99L)).thenReturn(Optional.empty());
        var dto = MoveDoctorDTO.builder()
                .appointmentId(99L)
                .toDoctorId(2L)
                .reason("overflow")
                .build();
        assertThatThrownBy(() -> service.moveDoctor(dto, 1L)).isInstanceOf(RuntimeException.class);
    }

    @Test
    void callNextPatient_doctorNotFound() {
        when(doctorRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.callNextPatient(1L, CallNextDTO.builder().build(), 1L))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void getPublicDisplay() {
        when(doctorRepository.findDoctorsWithAppointmentsOnDate(any())).thenReturn(List.of());
        assertThat(service.getPublicDisplay()).isEmpty();
    }

    @Test
    void getInternalDisplay() {
        when(doctorRepository.findDoctorsWithAppointmentsOnDate(any())).thenReturn(List.of());
        assertThat(service.getInternalDisplay()).isEmpty();
    }

    @Test
    void getQueueAuditLog() {
        when(appointmentRepository.findQueueAuditEvents(any(), anyList())).thenReturn(List.of());
        assertThat(service.getQueueAuditLog(0, 20).getContent()).isEmpty();
    }

    @Test
    void getDoctorQueueHistory() {
        when(appointmentRepository.findQueueAuditEventsByDoctor(eq(1L), any(), anyList())).thenReturn(List.of());
        assertThat(service.getDoctorQueueHistory(1L)).isEmpty();
    }
}
