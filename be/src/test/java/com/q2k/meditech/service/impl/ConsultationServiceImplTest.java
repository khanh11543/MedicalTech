package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.ConsultationCreateUpdateDTO;
import com.q2k.meditech.dto.mapper.ConsultationMapper;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.FileStorageService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import com.q2k.meditech.service.ServiceOrderService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceImplTest {

    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private AmendmentRepository amendmentRepository;
    @Mock
    private ConsultationAttachmentRepository attachmentRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultationMapper consultationMapper;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private ServiceOrderService serviceOrderService;
    @Mock
    private ServiceOrderAuditLogService soAuditLogService;

    @InjectMocks
    private ConsultationServiceImpl service;

    @Test
    void getConsultationById_notFound_throws() {
        when(consultationRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.getConsultationById(9L));
    }

    @Test
    void getConsultationByAppointmentId_notFound_throws() {
        when(consultationRepository.findByAppointmentIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.getConsultationByAppointmentId(9L));
    }

    @Test
    void getDoctorConsultations_doctorMissing_throws() {
        when(doctorRepository.existsById(9L)).thenReturn(false);
        assertThrows(EntityNotFoundException.class, () ->
                service.getDoctorConsultations(9L, PageRequest.of(0, 10)));
    }

    @Test
    void createConsultation_appointmentMissing_throws() {
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () ->
                service.createConsultation(9L, ConsultationCreateUpdateDTO.builder().build()));
    }

    @Test
    void finalizeConsultation_noSecurityUser_throws() {
        com.q2k.meditech.entity.Consultation c = new com.q2k.meditech.entity.Consultation();
        c.setStatus(com.q2k.meditech.entity.enums.ConsultationStatus.DRAFT);
        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        try (MockedStatic<SecurityUtil> sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            assertThrows(IllegalStateException.class, () -> service.finalizeConsultation(1L));
        }
    }

    @Test
    void uploadAttachment_emptyFile_throws() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.uploadAttachment(1L, file));
    }

    @Test
    void getConsultationsByStatus_returnsPage() {
        when(consultationRepository.findByStatus(any(), any()))
                .thenReturn(new PageImpl<>(java.util.List.of()));
        assertNotNull(service.getConsultationsByStatus(
                com.q2k.meditech.entity.enums.ConsultationStatus.DRAFT, PageRequest.of(0, 5)));
    }
}
