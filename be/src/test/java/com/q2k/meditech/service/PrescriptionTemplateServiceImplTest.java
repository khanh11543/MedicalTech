package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PrescriptionRepository;
import com.q2k.meditech.repository.PrescriptionTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionTemplateServiceImplTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PrescriptionTemplateRepository prescriptionTemplateRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PrescriptionMapper prescriptionMapper;

    @InjectMocks
    private PrescriptionTemplateServiceImpl service;

    @Test
    void analyticsMethods() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        Doctor d = Doctor.builder().fullName("Dr").specialization("S").build();
        d.setId(1L);
        Patient p = Patient.builder().fullName("P").build();
        p.setId(2L);
        PrescriptionItem item = PrescriptionItem.builder().medicineName("Med").quantity(2).dosage("1").frequency("2").duration("3").build();
        item.setId(100L);
        Prescription rx = Prescription.builder()
                .doctor(d)
                .patient(p)
                .prescriptionDate(from)
                .status(PrescriptionStatus.ACTIVE)
                .isActive(true)
                .items(List.of(item))
                .build();
        rx.setId(1L);
        when(prescriptionRepository.findByPrescriptionDateBetween(from, to)).thenReturn(List.of(rx));
        when(prescriptionRepository.countDistinctPatientsByDateRange(from, to)).thenReturn(1L);
        when(prescriptionRepository.countDistinctDoctorsByDateRange(from, to)).thenReturn(1L);

        assertThat(service.getTemplateStatistics(from, to).getTotalPrescriptions()).isEqualTo(1L);
        assertThat(service.getTemplatesByDoctor(from, to, 5)).hasSize(1);
        assertThat(service.getCommonMedications(from, to, 5, "x")).hasSize(1);
        assertThat(service.getUsageTrends(from, to, "MONTH", null).getTrendData()).isNotEmpty();
        assertThat(service.getUsageTrends(from, to, "MONTH", 1L).getTotalPrescriptions()).isEqualTo(1L);

        when(prescriptionRepository.findAll()).thenReturn(List.of(rx));
        assertThat(service.getTemplateStatistics(null, null).getTotalPrescriptions()).isEqualTo(1L);
    }

    @Test
    void templateCrud() {
        User du = User.builder().email("d@d.com").build();
        du.setId(9L);
        Doctor doctor = Doctor.builder().user(du).fullName("D").build();
        doctor.setId(3L);
        when(doctorRepository.findByUserId(9L)).thenReturn(Optional.of(doctor));

        PrescriptionTemplate savedTpl = PrescriptionTemplate.builder()
                .doctor(doctor)
                .templateName("T")
                .isActive(true)
                .usageCount(0)
                .build();
        savedTpl.setId(50L);
        when(prescriptionTemplateRepository.save(any(PrescriptionTemplate.class))).thenReturn(savedTpl);
        when(prescriptionMapper.toTemplateDTO(any())).thenReturn(TemplateDTO.builder().id(50L).build());

        TemplateItemDTO ti = TemplateItemDTO.builder()
                .medicineName("M")
                .defaultDosage("1")
                .defaultFrequency("daily")
                .build();
        TemplateCreateDTO create = TemplateCreateDTO.builder()
                .templateName("T")
                .items(List.of(ti))
                .build();
        assertThat(service.createTemplate(create, 9L).getId()).isEqualTo(50L);

        when(prescriptionTemplateRepository.findByDoctorIdAndIsActiveTrue(3L)).thenReturn(List.of(savedTpl));
        assertThat(service.getDoctorTemplates(9L, true)).hasSize(1);
        when(prescriptionTemplateRepository.findByDoctorId(3L)).thenReturn(List.of(savedTpl));
        assertThat(service.getDoctorTemplates(9L, false)).hasSize(1);

        when(prescriptionTemplateRepository.findByIdWithDetails(50L)).thenReturn(Optional.of(savedTpl));
        assertThat(service.getTemplateById(50L, 9L).getId()).isEqualTo(50L);

        TemplateUpdateDTO upd = TemplateUpdateDTO.builder().templateName("N").items(List.of(ti)).build();
        when(prescriptionTemplateRepository.findByIdWithDetails(50L)).thenReturn(Optional.of(savedTpl));
        service.updateTemplate(50L, upd, 9L);

        when(prescriptionTemplateRepository.findById(50L)).thenReturn(Optional.of(savedTpl));
        service.deleteTemplate(50L, 9L);
        verify(prescriptionTemplateRepository, org.mockito.Mockito.times(3)).save(any(PrescriptionTemplate.class));
    }

    @Test
    void getTemplateItems_incrementsUsage() {
        User du = User.builder().build();
        du.setId(1L);
        Doctor doctor = Doctor.builder().user(du).build();
        doctor.setId(2L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doctor));
        PrescriptionTemplateItem pi = PrescriptionTemplateItem.builder().medicineName("A").defaultDosage("d").build();
        pi.setItemOrder(1);
        PrescriptionTemplate tpl = PrescriptionTemplate.builder().doctor(doctor).items(new java.util.ArrayList<>(List.of(pi))).build();
        tpl.setId(8L);
        when(prescriptionTemplateRepository.findByIdWithDetails(8L)).thenReturn(Optional.of(tpl));
        when(prescriptionTemplateRepository.save(any(PrescriptionTemplate.class))).thenAnswer(i -> i.getArgument(0));
        assertThat(service.getTemplateItems(8L, 1L)).hasSize(1);
    }

    @Test
    void applyTemplate_throws() {
        assertThatThrownBy(() -> service.applyTemplate(1L, ApplyTemplateDTO.builder().patientId(1L).build(), 1L))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void getTemplateById_wrongDoctor_forbidden() {
        User u1 = User.builder().build();
        u1.setId(1L);
        Doctor d1 = Doctor.builder().user(u1).build();
        d1.setId(10L);
        Doctor d2 = Doctor.builder().build();
        d2.setId(99L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(d1));
        PrescriptionTemplate tpl = PrescriptionTemplate.builder().doctor(d2).build();
        tpl.setId(1L);
        when(prescriptionTemplateRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(tpl));
        assertThatThrownBy(() -> service.getTemplateById(1L, 1L)).isInstanceOf(AppException.class);
    }

    @Test
    void createTemplate_doctorNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createTemplate(
                TemplateCreateDTO.builder().templateName("x").items(List.of(TemplateItemDTO.builder()
                        .medicineName("m")
                        .defaultDosage("1")
                        .defaultFrequency("daily")
                        .build())).build(),
                1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
