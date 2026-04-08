package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DataDeletionRequestMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.EmailService;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataDeletionRequestServiceImplTest {

    @Mock private DataDeletionRequestRepository deletionRequestRepository;
    @Mock private DeletionLogRepository deletionLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private DataDeletionRequestMapper mapper;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataDeletionRequestServiceImpl service;

    private MockedStatic<SecurityUtil> securityUtil;

    @AfterEach
    void tearDown() {
        if (securityUtil != null) {
            securityUtil.close();
        }
    }

    @Test
    void getDeletionRequests_mapsPage() {
        DeletionRequestFilterDTO filter = DeletionRequestFilterDTO.builder().page(0).size(10).sortBy("createdAt").sortDirection("desc").build();
        DataDeletionRequest entity = DataDeletionRequest.builder().build();
        entity.setId(1L);
        DataDeletionRequestDTO dto = DataDeletionRequestDTO.builder().id(1L).build();
        Page<DataDeletionRequest> page = new PageImpl<>(List.of(entity));
        when(deletionRequestRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(mapper.toDTO(entity)).thenReturn(dto);

        Page<DataDeletionRequestDTO> result = service.getDeletionRequests(filter);

        assertThat(result.getContent()).containsExactly(dto);
    }

    @Test
    void getReviewDetail_notFound_throws() {
        when(deletionRequestRepository.findByIdWithUser(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getReviewDetail(9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getReviewDetail_withPatient_setsCounts() {
        User user = User.builder().build();
        user.setId(10L);
        DataDeletionRequest request = DataDeletionRequest.builder().user(user).build();
        request.setId(1L);
        Doctor doctor = Doctor.builder().user(user).fullName("Dr").build();
        doctor.setId(99L);
        Patient patient = Patient.builder().user(user).fullName("P").build();
        patient.setId(20L);
        Appointment appt = Appointment.builder()
                .patient(patient).doctor(doctor)
                .appointmentDate(LocalDate.now()).appointmentTime(LocalTime.NOON)
                .startTime(LocalTime.NOON).endTime(LocalTime.NOON.plusHours(1))
                .bookedBy(BookedBy.PATIENT)
                .build();
        appt.setId(30L);
        when(deletionRequestRepository.findByIdWithUser(1L)).thenReturn(Optional.of(request));
        when(patientRepository.findByUserId(10L)).thenReturn(Optional.of(patient));
        when(appointmentRepository.findByPatientId(20L)).thenReturn(List.of(appt));
        when(prescriptionRepository.findByPatientId(20L)).thenReturn(List.of());
        when(paymentRepository.findByPatientIdOrderByCreatedAtDesc(20L)).thenReturn(List.of());
        when(reviewRepository.existsByAppointmentId(30L)).thenReturn(true);
        DeletionReviewDetailDTO detail = DeletionReviewDetailDTO.builder().build();
        when(mapper.toReviewDetailDTO(request)).thenReturn(detail);

        DeletionReviewDetailDTO out = service.getReviewDetail(1L);

        assertThat(out.getAppointmentCount()).isEqualTo(1);
        assertThat(out.getReviewCount()).isEqualTo(1);
        assertThat(out.getTotalRecords()).isEqualTo(2);
    }

    @Test
    void approveDeletionRequest_success() {
        securityUtil = mockStatic(SecurityUtil.class);
        securityUtil.when(SecurityUtil::getCurrentUserId).thenReturn(99L);
        User user = User.builder().email("a@b.c").fullName("U").build();
        user.setId(10L);
        DataDeletionRequest request = DataDeletionRequest.builder().status(DeletionRequestStatus.PENDING).user(user).build();
        request.setId(1L);
        when(deletionRequestRepository.findByIdWithUser(1L)).thenReturn(Optional.of(request));
        when(deletionRequestRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ApproveDeletionDTO dto = ApproveDeletionDTO.builder().sendNotification(false).executeImmediately(false).build();
        DataDeletionRequestDTO outDto = DataDeletionRequestDTO.builder().id(1L).build();
        when(mapper.toDTO(any())).thenReturn(outDto);

        assertThat(service.approveDeletionRequest(1L, dto)).isEqualTo(outDto);
        verify(deletionRequestRepository).save(argThat(r -> r.getStatus() == DeletionRequestStatus.APPROVED));
    }

    @Test
    void rejectDeletionRequest_wrongStatus_throws() {
        DataDeletionRequest request = DataDeletionRequest.builder().status(DeletionRequestStatus.COMPLETED).build();
        request.setId(1L);
        when(deletionRequestRepository.findByIdWithUser(1L)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> service.rejectDeletionRequest(1L, RejectDeletionDTO.builder().sendNotification(false).build()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void requestMoreInfo_updatesStatus() {
        securityUtil = mockStatic(SecurityUtil.class);
        securityUtil.when(SecurityUtil::getCurrentUserId).thenReturn(1L);
        User user = User.builder().build();
        user.setId(2L);
        DataDeletionRequest request = DataDeletionRequest.builder().status(DeletionRequestStatus.PENDING).user(user).build();
        request.setId(3L);
        when(deletionRequestRepository.findByIdWithUser(3L)).thenReturn(Optional.of(request));
        when(deletionRequestRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mapper.toDTO(any())).thenReturn(DataDeletionRequestDTO.builder().build());

        service.requestMoreInfo(3L, RequestInfoDTO.builder().requiredInfo("x").sendNotification(false).build());

        verify(deletionRequestRepository).save(argThat(r -> r.getStatus() == DeletionRequestStatus.UNDER_REVIEW));
    }

    @Test
    void cancelDeletionRequest_completed_throws() {
        DataDeletionRequest request = DataDeletionRequest.builder().status(DeletionRequestStatus.COMPLETED).build();
        request.setId(1L);
        when(deletionRequestRepository.findByIdWithUser(1L)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> service.cancelDeletionRequest(1L, CancelDeletionDTO.builder().sendNotification(false).build()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void executeDeletion_invalidPassword_throws() {
        securityUtil = mockStatic(SecurityUtil.class);
        securityUtil.when(SecurityUtil::getCurrentUserId).thenReturn(5L);
        User target = User.builder().email("t@t.t").fullName("T").build();
        target.setId(10L);
        DataDeletionRequest request = DataDeletionRequest.builder().status(DeletionRequestStatus.APPROVED).user(target).build();
        request.setId(1L);
        User admin = User.builder().passwordHash("hash").build();
        admin.setId(5L);
        when(deletionRequestRepository.findByIdWithUser(1L)).thenReturn(Optional.of(request));
        when(userRepository.findById(5L)).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.executeDeletion(1L, ExecuteDeletionDTO.builder()
                .adminPassword("wrong").confirmationPhrase("DELETE USER 10").build()))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("password");
    }

    @Test
    void getDeletionLog_returnsMappedPage() {
        DeletionLog log = DeletionLog.builder().build();
        log.setId(1L);
        DeletionLogDTO dto = DeletionLogDTO.builder().id(1L).build();
        when(deletionLogRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(log)));
        when(mapper.toLogDTO(log)).thenReturn(dto);

        Page<DeletionLogDTO> page = service.getDeletionLog(0, 10, "executedDate", "desc");

        assertThat(page.getContent()).containsExactly(dto);
    }
}
