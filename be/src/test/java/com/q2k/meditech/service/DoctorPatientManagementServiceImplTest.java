package com.q2k.meditech.service;

import com.q2k.meditech.dto.PageResponse;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorPatientManagementServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @InjectMocks
    private DoctorPatientManagementServiceImpl service;

    @Test
    void getMyPatients_doctorMissing_throws() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        Pageable p = PageRequest.of(0, 10);
        assertThatThrownBy(() -> service.getMyPatients(1L, null, p))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyPatients_withSearch() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(Doctor.builder().build()));
        Patient pat = patient(5L);
        when(appointmentRepository.searchPatientsByDoctorId(eq(1L), eq("jo"), any()))
                .thenReturn(new PageImpl<>(List.of(pat)));
        when(appointmentRepository.countVisitsByDoctorAndPatient(eq(1L), eq(5L))).thenReturn(1);
        when(appointmentRepository.findLastAppointmentDateByDoctorAndPatient(1L, 5L)).thenReturn(LocalDate.now());
        when(appointmentRepository.findLastAppointmentByDoctorAndPatient(1L, 5L)).thenReturn(Optional.empty());
        when(prescriptionRepository.findByPatientId(5L)).thenReturn(List.of());
        when(appointmentRepository.findUpcomingAppointmentsByDoctorAndPatient(1L, 5L)).thenReturn(List.of());
        PageResponse<?> res = service.getMyPatients(1L, "jo", PageRequest.of(0, 10));
        assertThat(res.getContent()).hasSize(1);
    }

    @Test
    void getPatientDetail() {
        when(appointmentRepository.hasAppointmentWithPatient(1L, 5L)).thenReturn(true);
        User u = User.builder().email("e@e.com").phone("1").build();
        Patient pat = Patient.builder().user(u).fullName("P").build();
        pat.setId(5L);
        when(patientRepository.findByIdWithUser(5L)).thenReturn(Optional.of(pat));
        when(appointmentRepository.countVisitsByDoctorAndPatient(1L, 5L)).thenReturn(0);
        when(appointmentRepository.findLastAppointmentByDoctorAndPatient(1L, 5L)).thenReturn(Optional.empty());
        when(consultationRepository.findByPatientId(5L)).thenReturn(List.of());
        when(prescriptionRepository.findByPatientId(5L)).thenReturn(List.of());
        when(appointmentRepository.findUpcomingAppointmentsByDoctorAndPatient(1L, 5L)).thenReturn(List.of());
        assertThat(service.getPatientDetail(1L, 5L).getFullName()).isEqualTo("P");
    }

    @Test
    void getPatientMedicalRecords() {
        when(appointmentRepository.hasAppointmentWithPatient(1L, 5L)).thenReturn(true);
        when(consultationRepository.findFinalizedByDoctorIdAndPatientId(eq(1L), eq(5L), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getPatientMedicalRecords(1L, 5L, PageRequest.of(0, 5)).getContent()).isEmpty();
    }

    @Test
    void getRecentPatients() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(Doctor.builder().build()));
        Patient pat = patient(3L);
        when(appointmentRepository.findRecentPatientsByDoctorId(eq(1L), any(LocalDate.class), any()))
                .thenReturn(new PageImpl<>(List.of(pat)));
        when(appointmentRepository.findLastAppointmentByDoctorAndPatient(1L, 3L)).thenReturn(Optional.empty());
        when(appointmentRepository.findUpcomingAppointmentsByDoctorAndPatient(1L, 3L)).thenReturn(List.of());
        when(medicalRecordRepository.findMedicalRecordsByDoctorIdAndPatientId(1L, 3L)).thenReturn(List.of());
        assertThat(service.getRecentPatients(1L, PageRequest.of(0, 10)).getContent()).hasSize(1);
    }

    @Test
    void flagTabs_and_cohortStats() {
        Patient a = Patient.builder().allergies("x").medicalHistory("").build();
        a.setId(1L);
        a.setUser(User.builder().email("a@a.com").build());
        when(appointmentRepository.findDistinctPatientsByDoctorId(eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(a)));
        assertThat(service.getPatientsWithFlags(2L, PageRequest.of(0, 10)).getContent()).isNotEmpty();
        assertThat(service.getPatientsWithAllergies(2L, PageRequest.of(0, 10)).getContent()).hasSize(1);

        Patient c = Patient.builder().allergies("").medicalHistory("diabetes").build();
        c.setId(2L);
        c.setUser(User.builder().email("b@b.com").build());
        when(appointmentRepository.findDistinctPatientsByDoctorId(eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(c)));
        assertThat(service.getPatientsWithChronicConditions(2L, PageRequest.of(0, 10)).getContent()).hasSize(1);

        Prescription rx = Prescription.builder().isActive(true).status(PrescriptionStatus.ACTIVE).build();
        Patient poly = Patient.builder().allergies("").medicalHistory("").build();
        poly.setId(4L);
        poly.setUser(User.builder().email("c@c.com").build());
        when(appointmentRepository.findDistinctPatientsByDoctorId(eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(poly)));
        when(prescriptionRepository.findByPatientId(4L)).thenReturn(List.of(rx, rx));
        assertThat(service.getPatientsWithMedicationRisk(2L, PageRequest.of(0, 10)).getContent()).hasSize(1);

        when(appointmentRepository.findDistinctPatientsByDoctorId(eq(2L), any()))
                .thenReturn(new PageImpl<>(List.of(poly)));
        when(prescriptionRepository.findByPatientId(4L)).thenReturn(List.of(rx, rx, rx));
        assertThat(service.getHighRiskPatients(2L, PageRequest.of(0, 10)).getContent()).isNotEmpty();

        when(doctorRepository.findById(3L)).thenReturn(Optional.of(Doctor.builder().build()));
        when(appointmentRepository.findDistinctPatientsByDoctorId(eq(3L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(appointmentRepository.findRecentPatientsByDoctorId(eq(3L), any(LocalDate.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0));
        assertThat(service.getPatientCohortStats(3L).getTotalPatients()).isEqualTo(0L);
    }

    private static Patient patient(Long id) {
        Patient p = Patient.builder()
                .fullName("P")
                .user(User.builder().email("p@p.com").phone("0").build())
                .build();
        p.setId(id);
        return p;
    }
}
