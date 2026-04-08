package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceptionistPatientServiceImplTest {

    @Mock private PatientRepository patientRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private MedicalRecordRepository medicalRecordRepository;
    @Mock private PatientDocumentRepository patientDocumentRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private PrivacyMaskingService privacyMaskingService;
    @Mock private SmsService smsService;
    @Mock private ObjectMapper objectMapper;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private ReceptionistPatientServiceImpl service;

    @Test
    void listAllPatients() {
        Pageable p = PageRequest.of(0, 5);
        Patient pt = Patient.builder().user(User.builder().email("a@a.a").fullName("N").build()).fullName("N").build();
        pt.setId(1L);
        pt.getUser().setId(2L);
        when(privacyMaskingService.maskPhone(any())).thenReturn("***");
        when(privacyMaskingService.maskEmail(any())).thenReturn("***");
        when(appointmentRepository.countByPatientId(1L)).thenReturn(0L);
        when(patientRepository.findAllWithFilters(isNull(), isNull(), isNull(), isNull(), eq(p)))
                .thenReturn(new PageImpl<>(List.of(pt)));

        Page<PatientListDTO> page = service.listAllPatients(null, null, null, null, p);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void searchPatients_shortQuery_throws() {
        assertThatThrownBy(() -> service.searchPatients("ab", PageRequest.of(0, 5)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getPatientStats() {
        when(patientRepository.count()).thenReturn(1L);
        when(patientRepository.countActivePatients()).thenReturn(1L);
        when(patientRepository.countDeactivatedPatients()).thenReturn(0L);
        when(patientRepository.countNewPatientsThisMonth(any())).thenReturn(0L);
        when(patientRepository.countInsuredPatients()).thenReturn(0L);
        when(patientRepository.countUninsuredPatients()).thenReturn(1L);
        when(patientRepository.countByGender(anyString())).thenReturn(0L);

        assertThat(service.getPatientStats().getTotalPatients()).isEqualTo(1L);
    }

    @Test
    void getMessageTemplates() {
        assertThat(service.getMessageTemplates()).isNotEmpty();
    }

    @Test
    void getPatientDetail_notFound_throws() {
        when(patientRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getPatientDetail(1L, 9L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
