package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.ServiceResultCreateDTO;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.FileStorageService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceResultServiceImplTest {

    @Mock
    private ServiceResultRepository serviceResultRepository;
    @Mock
    private ServiceOrderRepository serviceOrderRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private ServiceOrderAuditLogService soAuditLogService;

    @InjectMocks
    private ServiceResultServiceImpl service;

    @Test
    void saveResult_orderNotFound_throws() {
        when(serviceOrderRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () ->
                service.saveResult(9L, ServiceResultCreateDTO.builder().markCompleted(false).build()));
    }

    @Test
    void getResultByServiceOrderId_notFound_throws() {
        when(serviceResultRepository.findByServiceOrderIdWithAttachments(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.getResultByServiceOrderId(9L));
    }

    @Test
    void uploadAttachment_orderNotFound_throws() {
        when(serviceOrderRepository.findById(9L)).thenReturn(Optional.empty());
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        assertThrows(EntityNotFoundException.class, () -> service.uploadAttachment(9L, file));
    }

    @Test
    void deleteAttachment_noResult_throws() {
        when(serviceResultRepository.findByServiceOrderIdWithAttachments(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.deleteAttachment(9L, 1L));
    }
}
