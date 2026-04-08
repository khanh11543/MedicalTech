package com.q2k.meditech.service;

import com.q2k.meditech.dto.AdminDashboardDTO;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private ReceptionistRepository receptionistRepository;
    @Mock
    private DoctorDocumentRepository doctorDocumentRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private StaffRegistryRepository staffRegistryRepository;

    @InjectMocks
    private AdminDashboardService adminDashboardService;

    @Test
    void getDashboardStatistics_returnsDto() {
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.countDistinctByRoleName("ADMIN")).thenReturn(0L);
        when(userRepository.countByIsActive(true)).thenReturn(0L);
        when(doctorRepository.count()).thenReturn(0L);
        when(patientRepository.count()).thenReturn(0L);
        when(receptionistRepository.count()).thenReturn(0L);
        when(doctorDocumentRepository.countByStatus(org.mockito.ArgumentMatchers.any())).thenReturn(0L);
        when(appointmentRepository.count()).thenReturn(0L);
        when(appointmentRepository.countInRange(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.isNull()))
                .thenReturn(0L);
        when(appointmentRepository.countByStatus(org.mockito.ArgumentMatchers.any())).thenReturn(0L);
        when(staffRegistryRepository.countByStatus("PENDING")).thenReturn(0L);
        when(staffRegistryRepository.countByStatus("REGISTERED")).thenReturn(0L);
        when(userRepository.findRecentWithRoles(org.mockito.ArgumentMatchers.any())).thenReturn(java.util.List.of());
        when(appointmentRepository.findRecentWithDetails(org.mockito.ArgumentMatchers.any())).thenReturn(java.util.List.of());

        AdminDashboardDTO dto = adminDashboardService.getDashboardStatistics();
        assertNotNull(dto);
        assertNotNull(dto.getGeneratedAt());
    }
}
