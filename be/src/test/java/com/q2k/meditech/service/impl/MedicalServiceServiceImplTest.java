package com.q2k.meditech.service.impl;

import com.q2k.meditech.entity.MedicalService;
import com.q2k.meditech.entity.enums.ServiceCategory;
import com.q2k.meditech.repository.MedicalServiceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalServiceServiceImplTest {

    @Mock
    private MedicalServiceRepository medicalServiceRepository;

    @InjectMocks
    private MedicalServiceServiceImpl service;

    @Test
    void getAllActiveServices_returnsList() {
        when(medicalServiceRepository.findByActiveTrueOrderByServiceNameAsc()).thenReturn(List.of());
        assertNotNull(service.getAllActiveServices());
    }

    @Test
    void getServicesByCategory_invalidCategory_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.getServicesByCategory("NOT_A_CATEGORY"));
    }

    @Test
    void getServicesByCategory_valid_returnsList() {
        MedicalService ms = MedicalService.builder()
                .serviceName("X-Ray")
                .category(ServiceCategory.DIAGNOSTIC_IMAGING)
                .active(true)
                .build();
        ms.setId(1L);
        when(medicalServiceRepository.findByCategoryAndActiveTrueOrderByServiceNameAsc(ServiceCategory.DIAGNOSTIC_IMAGING))
                .thenReturn(List.of(ms));
        assertFalse(service.getServicesByCategory("DIAGNOSTIC_IMAGING").isEmpty());
    }
}
