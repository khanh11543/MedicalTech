package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.ServiceOrderCreateDTO;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceOrderServiceImplTest {

    @Mock
    private ServiceOrderRepository serviceOrderRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MedicalServiceRepository medicalServiceRepository;
    @Mock
    private SpecialtyRepository specialtyRepository;
    @Mock
    private ServiceOrderAuditLogService soAuditLogService;

    @InjectMocks
    private ServiceOrderServiceImpl service;

    @Test
    void createServiceOrder_appointmentMissing_throws() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.empty());
        ServiceOrderCreateDTO dto = ServiceOrderCreateDTO.builder()
                .category("LABORATORY")
                .serviceName("Blood test")
                .build();
        assertThrows(EntityNotFoundException.class, () -> service.createServiceOrder(1L, dto));
    }

    @Test
    void getServiceOrdersByAppointment_mapsList() {
        when(serviceOrderRepository.findByAppointmentIdOrderByOrderedAtDesc(2L)).thenReturn(List.of());
        assertNotNull(service.getServiceOrdersByAppointment(2L));
    }

    @Test
    void cancelServiceOrder_notFound_throws() {
        when(serviceOrderRepository.findById(9L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.cancelServiceOrder(9L));
    }

    @Test
    void collectPayment_invalidMethod_throws() {
        assertThrows(IllegalArgumentException.class, () -> service.collectPayment(1L, "CARD", 1L));
    }

    @Test
    void hasPendingServiceOrders_delegatesToRepo() {
        when(serviceOrderRepository.existsByAppointmentIdAndStatusIn(eq(3L), anyList())).thenReturn(false);
        assertFalse(service.hasPendingServiceOrders(3L));
    }

    @Test
    void getPendingPaymentOrders_returnsList() {
        when(serviceOrderRepository.findByAppointmentIdAndStatusIn(eq(4L), anyList())).thenReturn(List.of());
        assertNotNull(service.getPendingPaymentOrders(4L));
    }

    @Test
    void getPendingPaymentServiceOrdersForPatient_returnsList() {
        when(serviceOrderRepository.findByPatientIdAndStatusIn(eq(5L), anyList())).thenReturn(List.of());
        assertNotNull(service.getPendingPaymentServiceOrdersForPatient(5L));
    }
}
