package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceImplTest {

    @Mock PrescriptionRepository prescriptionRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock PrescriptionMapper prescriptionMapper;
    @Mock PrescriptionTemplateRepository prescriptionTemplateRepository;
    @Mock MedicationInventoryRepository medicationInventoryRepository;
    @Mock MedicationInventoryLogRepository medicationInventoryLogRepository;

    @InjectMocks PrescriptionServiceImpl service;

    @Test
    void createPrescription_doctorNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        var dto = PrescriptionCreateDTO.builder()
                .patientId(2L)
                .items(List.of())
                .build();
        assertThatThrownBy(() -> service.createPrescription(dto, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPrescriptionById_notFound() {
        when(prescriptionRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPrescriptionById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPatientPrescriptions_empty() {
        when(prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getPatientPrescriptions(1L, null, null, 0, 10).getContent()).isEmpty();
    }

    @Test
    void getDoctorPrescriptions_empty() {
        when(prescriptionRepository.findByDoctorId(1L)).thenReturn(List.of());
        assertThat(service.getDoctorPrescriptions(1L, null, null, 0, 10).getContent()).isEmpty();
    }

    @Test
    void getAllPrescriptionsForAdmin_empty() {
        when(prescriptionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        var filter = PrescriptionFilterDTO.builder().sortBy("prescriptionDate").build();
        assertThat(service.getAllPrescriptionsForAdmin(filter).getContent()).isEmpty();
    }

    @Test
    void getPrescriptionStatistics_emptyRange() {
        when(prescriptionRepository.findByPrescriptionDateBetween(any(), any())).thenReturn(List.of());
        assertThat(service.getPrescriptionStatistics(LocalDate.now(), LocalDate.now()).getTotalPrescriptions()).isZero();
    }

    @Test
    void getPrescriptionDetailForAdmin_notFound() {
        when(prescriptionRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPrescriptionDetailForAdmin(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void exportPrescriptions_csv() throws Exception {
        when(prescriptionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        var filter = PrescriptionFilterDTO.builder().sortBy("prescriptionDate").build();
        Resource r = service.exportPrescriptions(filter, "CSV");
        assertThat(r.getContentAsByteArray().length).isPositive();
    }

    @Test
    void generatePrescriptionPdf_notFound() {
        when(prescriptionRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.generatePrescriptionPdf(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void generatePrintTemplate_notFound() {
        when(prescriptionRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.generatePrintTemplate(1L, "html")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void sendPrescriptionEmail_notFound() {
        when(prescriptionRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.sendPrescriptionEmail(1L, SendPrescriptionEmailDTO.builder().email("a@a.a").build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void voidPrescription_prescriptionNotFound() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(5L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.voidPrescription(9L, 1L, "r")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reissuePrescription_prescriptionNotFound() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(5L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reissuePrescription(9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDoctorTemplates_doctorNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDoctorTemplates(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDoctorTemplates_empty() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(3L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionTemplateRepository.findByDoctorIdAndIsActiveTrue(3L)).thenReturn(List.of());
        assertThat(service.getDoctorTemplates(1L)).isEmpty();
    }

    @Test
    void getTemplateById_doctorNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getTemplateById(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createTemplate_doctorNotFound() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createTemplate(TemplateSaveDTO.builder().templateName("T").build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateTemplate_templateNotFound() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(3L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionTemplateRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateTemplate(9L, TemplateSaveDTO.builder().templateName("X").build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTemplate_templateNotFound() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(3L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionTemplateRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteTemplate(9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void applyTemplateItems_templateNotFound() {
        Doctor doc = Doctor.builder().user(User.builder().email("d@d.d").fullName("D").build()).fullName("D").build();
        doc.setId(3L);
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doc));
        when(prescriptionTemplateRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.applyTemplateItems(9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
