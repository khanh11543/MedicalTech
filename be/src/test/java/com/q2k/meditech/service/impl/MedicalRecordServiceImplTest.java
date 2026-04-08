package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.MedicalRecord;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.MedicalRecordRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceImplTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;
    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private MedicalRecordServiceImpl service;

    private MedicalRecord sampleRecord() {
        User u = User.builder().fullName("Dr Who").build();
        u.setId(2L);
        Doctor d = Doctor.builder().user(u).fullName("Dr Who").specialization("Cardio").build();
        d.setId(1L);
        MedicalRecord r = MedicalRecord.builder().recordCode("R1").doctor(d).visitDate(LocalDate.now())
                .chiefComplaint("c").build();
        r.setId(10L);
        return r;
    }

    @Test
    void getDoctorMedicalRecords_doctorMissing_throws() {
        when(doctorRepository.existsById(1L)).thenReturn(false);
        assertThatThrownBy(() -> service.getDoctorMedicalRecords(1L, 0, 10, null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDoctorMedicalRecords_withDateRange() {
        when(doctorRepository.existsById(1L)).thenReturn(true);
        MedicalRecord r = sampleRecord();
        Page<MedicalRecord> page = new PageImpl<>(List.of(r));
        when(medicalRecordRepository.findByDoctorIdAndDateRange(eq(1L), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        Page<MedicalRecordDTO> out = service.getDoctorMedicalRecords(1L, 0, 10, LocalDate.now(), LocalDate.now());

        assertThat(out.getContent()).hasSize(1);
        assertThat(out.getContent().get(0).getDoctorId()).isEqualTo(1L);
    }

    @Test
    void getDoctorPatientRecords() {
        when(doctorRepository.existsById(1L)).thenReturn(true);
        MedicalRecord r = sampleRecord();
        when(medicalRecordRepository.findByDoctorIdAndPatientId(eq(1L), eq(5L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(r)));

        assertThat(service.getDoctorPatientRecords(1L, 5L, 0, 10).getContent()).hasSize(1);
    }

    @Test
    void getDoctorMedicalRecord() {
        MedicalRecord r = sampleRecord();
        when(medicalRecordRepository.findByIdAndDoctorId(10L, 1L)).thenReturn(Optional.of(r));

        MedicalRecordDTO dto = service.getDoctorMedicalRecord(10L, 1L);
        assertThat(dto.getId()).isEqualTo(10L);
    }

    @Test
    void getPatientMedicalRecords() {
        MedicalRecord r = sampleRecord();
        when(medicalRecordRepository.findByPatientId(eq(9L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(r)));

        assertThat(service.getPatientMedicalRecords(9L, 0, 10, null, null).getContent()).hasSize(1);
    }

    @Test
    void getPatientMedicalRecord_notFound_throws() {
        when(medicalRecordRepository.findByIdAndPatientId(1L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPatientMedicalRecord(1L, 2L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void patientHasRecords() {
        when(medicalRecordRepository.existsByPatientId(3L)).thenReturn(true);
        assertThat(service.patientHasRecords(3L)).isTrue();
    }

    @Test
    void countPatientRecords() {
        when(medicalRecordRepository.countByPatientId(3L)).thenReturn(7L);
        assertThat(service.countPatientRecords(3L)).isEqualTo(7L);
    }

    @Test
    void countDoctorRecords() {
        when(medicalRecordRepository.countByDoctorId(1L)).thenReturn(4L);
        assertThat(service.countDoctorRecords(1L)).isEqualTo(4L);
    }

    @Test
    void getDoctorMedicalRecordByAppointmentId() {
        MedicalRecord r = sampleRecord();
        when(medicalRecordRepository.findByAppointmentId(100L)).thenReturn(Optional.of(r));

        MedicalRecordDTO dto = service.getDoctorMedicalRecordByAppointmentId(100L, 1L);
        assertThat(dto).isNotNull();
        assertThat(dto.getDoctorId()).isEqualTo(1L);
    }

    @Test
    void getDoctorMedicalRecordByAppointmentId_wrongDoctor_returnsNull() {
        MedicalRecord r = sampleRecord();
        when(medicalRecordRepository.findByAppointmentId(100L)).thenReturn(Optional.of(r));
        assertThat(service.getDoctorMedicalRecordByAppointmentId(100L, 99L)).isNull();
    }
}
