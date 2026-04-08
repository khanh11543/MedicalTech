package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DataExportRequestMapper;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataExportRequestServiceImplTest {

    @Mock
    private DataExportRequestRepository exportRequestRepository;
    @Mock
    private DataExportRequestMapper exportRequestMapper;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private DataExportRequestServiceImpl service;

    @Test
    void getExportRequests_returnsPage() {
        when(exportRequestRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(exportRequestMapper.toDTOPage(any())).thenReturn(new PageImpl<>(List.of()));
        Page<DataExportRequestDTO> page = service.getExportRequests(ExportRequestFilterDTO.builder().build());
        assertNotNull(page);
    }

    @Test
    void processExportRequest_notFound_throws() {
        when(exportRequestRepository.findByIdWithUser(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                service.processExportRequest(9L, ProcessExportRequestDTO.builder().sendEmail(false).build()));
    }

    @Test
    void downloadExportFile_notFound_throws() {
        when(exportRequestRepository.findByIdWithUser(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.downloadExportFile(9L));
    }

    @Test
    void getExportFileName_notFound_throws() {
        when(exportRequestRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getExportFileName(9L));
    }

    @Test
    void sendExportEmail_notFound_throws() {
        when(exportRequestRepository.findByIdWithUser(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                service.sendExportEmail(9L, SendExportEmailDTO.builder().build()));
    }

    @Test
    void deleteExportRequest_notFound_throws() {
        when(exportRequestRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.deleteExportRequest(9L));
    }

    @Test
    void toggleAutoProcess_returnsConfig() {
        AutoProcessConfigDTO dto = AutoProcessConfigDTO.builder().enabled(true).processWithinHours(12).build();
        assertNotNull(service.toggleAutoProcess(dto));
    }

    @Test
    void getAutoProcessConfig_returnsDto() {
        assertNotNull(service.getAutoProcessConfig());
    }
}
