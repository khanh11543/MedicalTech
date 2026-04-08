package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.AppointmentMapper;
import com.q2k.meditech.dto.mapper.TimeSlotMapper;
import com.q2k.meditech.dto.receptionist.BulkConfirmDTO;
import com.q2k.meditech.dto.receptionist.CreateFollowUpDTO;
import com.q2k.meditech.dto.receptionist.SendReminderDTO;
import com.q2k.meditech.dto.receptionist.SendTemplateMessageDTO;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AppointmentServiceImplTest {

    private static final long MISSING = 404L;

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private AppointmentHistoryRepository historyRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AppointmentMapper appointmentMapper;
    @Mock
    private TimeSlotMapper timeSlotMapper;
    @Mock
    private PrescriptionRepository prescriptionRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationEventService notificationEventService;
    @Mock
    private TimeSlotRepository timeSlotRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private PrivacyMaskingService privacyMaskingService;
    @Mock
    private PaymentService paymentService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    @BeforeEach
    void stubMissingAppointment() {
        when(appointmentRepository.findByIdWithDetails(MISSING)).thenReturn(Optional.empty());
    }

    @BeforeEach
    void stubStatsRepositories() {
        when(appointmentRepository.findByDateRange(any(), any())).thenReturn(List.of());
        when(appointmentRepository.countInRange(any(), any(), any())).thenReturn(0L);
        when(appointmentRepository.countByStatusInRange(any(), any(), any(), any())).thenReturn(0L);
        when(appointmentRepository.countDistinctDoctors(any(), any())).thenReturn(0L);
        when(appointmentRepository.countByDateAndStatusInRange(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.getStatusDistribution(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.getDoctorStats(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(appointmentRepository.getHeatmapData(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.getCancellationsByRole(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.getCancellationReasons(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.countScheduledAppointments(any(), any(), any())).thenReturn(0L);
        when(appointmentRepository.getNoShowsByDayOfWeek(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.getNoShowPatients(any(), any(), any())).thenReturn(List.of());
        when(appointmentRepository.findCompletedWithTimestamps(any(), any(), any())).thenReturn(List.of());
    }

    @Test
    void bookAppointment_patientNotFound_throwsResourceNotFoundException() {
        BookAppointmentDTO dto = BookAppointmentDTO.builder()
                .patientId(1L)
                .doctorId(2L)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .build();
        when(patientRepository.findByIdWithUser(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.bookAppointment(dto, 99L, BookedBy.PATIENT));
    }

    @Test
    void getPatientAppointments_returnsPage() {
        when(appointmentRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertNotNull(appointmentService.getPatientAppointments(1L, AppointmentFilterDTO.builder().build()));
    }

    @Test
    void getDoctorAppointments_returnsPage() {
        when(appointmentRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertNotNull(appointmentService.getDoctorAppointments(1L, AppointmentFilterDTO.builder().build()));
    }

    @Test
    void getDoctorAppointmentHistory_returnsPage() {
        when(appointmentRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertNotNull(appointmentService.getDoctorAppointmentHistory(1L, AppointmentFilterDTO.builder().build()));
    }

    @Test
    void checkInPatient_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.checkInPatient(MISSING, 1L));
    }

    @Test
    void confirmAppointment_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.confirmAppointment(MISSING, null, 1L, "ADMIN"));
    }

    @Test
    void getUpcomingAppointments_returnsPage() {
        when(appointmentRepository.findAllWithFiltersAdmin(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(privacyMaskingService.maskPhone(any())).thenReturn("***");
        assertNotNull(appointmentService.getUpcomingAppointments(
                LocalDate.now(), LocalDate.now().plusDays(7), 0, 10));
    }

    @Test
    void bulkConfirmAppointments_returnsResult() {
        when(appointmentRepository.findByIdWithDetails(MISSING)).thenReturn(Optional.empty());
        BulkConfirmDTO dto = BulkConfirmDTO.builder().appointmentIds(List.of(MISSING)).build();
        assertNotNull(appointmentService.bulkConfirmAppointments(dto, 1L));
    }

    @Test
    void sendAppointmentReminder_appointmentMissing_throwsResourceNotFoundException() {
        SendReminderDTO dto = SendReminderDTO.builder().channel("EMAIL").build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.sendAppointmentReminder(MISSING, dto, 1L));
    }

    @Test
    void sendTemplateMessage_appointmentMissing_throwsResourceNotFoundException() {
        SendTemplateMessageDTO dto = SendTemplateMessageDTO.builder()
                .channel("EMAIL")
                .templateId("REMINDER_EMAIL")
                .build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.sendTemplateMessage(MISSING, dto, 1L));
    }

    @Test
    void getAppointmentDocuments_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getAppointmentDocuments(MISSING));
    }

    @Test
    void createFollowUp_appointmentMissing_throwsResourceNotFoundException() {
        CreateFollowUpDTO dto = CreateFollowUpDTO.builder()
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.createFollowUp(MISSING, dto, 1L));
    }

    @Test
    void generateCheckInSlip_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.generateCheckInSlip(MISSING));
    }

    @Test
    void getNotificationTemplates_returnsNonNullList() {
        assertNotNull(appointmentService.getNotificationTemplates());
    }

    @Test
    void getAppointmentCategories_returnsNonNullList() {
        assertNotNull(appointmentService.getAppointmentCategories());
    }

    @Test
    void rescheduleAppointment_appointmentMissing_throwsResourceNotFoundException() {
        RescheduleDTO dto = RescheduleDTO.builder()
                .newDate(LocalDate.now().plusDays(3))
                .newStartTime(LocalTime.of(11, 0))
                .newEndTime(LocalTime.of(11, 30))
                .build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.rescheduleAppointment(MISSING, dto, 1L, "ADMIN"));
    }

    @Test
    void cancelAppointment_appointmentMissing_throwsResourceNotFoundException() {
        CancelDTO dto = CancelDTO.builder().reason("x").build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.cancelAppointment(MISSING, dto, 1L, "ADMIN"));
    }

    @Test
    void getAppointmentById_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getAppointmentById(MISSING));
    }

    @Test
    void getAppointmentHistory_appointmentMissing_throwsResourceNotFoundException() {
        when(appointmentRepository.existsById(MISSING)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getAppointmentHistory(MISSING));
    }

    @Test
    void getAllAppointments_returnsPage() {
        when(appointmentRepository.findAllWithFiltersAdmin(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertNotNull(appointmentService.getAllAppointments(AppointmentFilterDTO.builder().build()));
    }

    @Test
    void getAppointmentStats_returnsNonNull() {
        assertNotNull(appointmentService.getAppointmentStats());
    }

    @Test
    void bulkSendReminders_returnsResult() {
        when(appointmentRepository.findByIdWithDetails(MISSING)).thenReturn(Optional.empty());
        BulkReminderDTO dto = BulkReminderDTO.builder().appointmentIds(List.of(MISSING)).build();
        assertNotNull(appointmentService.bulkSendReminders(dto, 1L, "ADMIN"));
    }

    @Test
    void bulkCancelAppointments_returnsResult() {
        when(appointmentRepository.findByIdWithDetails(MISSING)).thenReturn(Optional.empty());
        BulkCancelDTO dto = BulkCancelDTO.builder()
                .appointmentIds(List.of(MISSING))
                .reason("reason")
                .build();
        assertNotNull(appointmentService.bulkCancelAppointments(dto, 1L, "ADMIN"));
    }

    @Test
    void exportAppointments_returnsNonNullBytes() {
        when(appointmentRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of());
        ExportFilterDTO filter = ExportFilterDTO.builder().format("CSV").build();
        byte[] bytes = appointmentService.exportAppointments(filter);
        assertNotNull(bytes);
    }

    @Test
    void getAppointmentDetail_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getAppointmentDetail(MISSING));
    }

    @Test
    void markAsNoShow_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.markAsNoShow(MISSING, NoShowDTO.builder().reason("r").build(), 1L, "DOCTOR"));
    }

    @Test
    void notifyDoctorPatientReady_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.notifyDoctorPatientReady(MISSING, NotifyDoctorDTO.builder().build(), 1L));
    }

    @Test
    void startConsultation_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.startConsultation(MISSING, 1L, "DOCTOR"));
    }

    @Test
    void completeConsultation_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.completeConsultation(MISSING, CompleteAppointmentDTO.builder().build(), 1L, "DOCTOR"));
    }

    @Test
    void getCommunicationLogs_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getCommunicationLogs(MISSING));
    }

    @Test
    void sendCustomMessage_appointmentMissing_throwsResourceNotFoundException() {
        CustomMessageDTO dto = CustomMessageDTO.builder().messageType("EMAIL").message("hi").build();
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.sendCustomMessage(MISSING, dto, 1L));
    }

    @Test
    void getRelatedRecords_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.getRelatedRecords(MISSING));
    }

    @Test
    void exportHistoryToPdf_appointmentMissing_throwsResourceNotFoundException() {
        assertThrows(ResourceNotFoundException.class, () -> appointmentService.exportHistoryToPdf(MISSING));
    }

    @Test
    void getSummaryStatistics_returnsNonNull() {
        assertNotNull(appointmentService.getSummaryStatistics(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void getAppointmentsOverTime_returnsNonNull() {
        assertNotNull(appointmentService.getAppointmentsOverTime(
                LocalDate.now().minusDays(7), LocalDate.now(), "DAY", null));
    }

    @Test
    void getStatusDistribution_returnsNonNull() {
        assertNotNull(appointmentService.getStatusDistribution(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void getStatsByDoctor_returnsPage() {
        assertNotNull(appointmentService.getStatsByDoctor(
                LocalDate.now().minusDays(7), LocalDate.now(), 0, 10, "totalAppointments", "DESC"));
    }

    @Test
    void getPeakHoursHeatmap_returnsNonNull() {
        assertNotNull(appointmentService.getPeakHoursHeatmap(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void getCancellationAnalysis_returnsNonNull() {
        assertNotNull(appointmentService.getCancellationAnalysis(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void getNoShowAnalysis_returnsNonNull() {
        assertNotNull(appointmentService.getNoShowAnalysis(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void getWaitTimeStats_returnsNonNull() {
        assertNotNull(appointmentService.getWaitTimeStats(
                LocalDate.now().minusDays(7), LocalDate.now(), null));
    }

    @Test
    void exportStatisticsPdf_returnsNonEmptyBytes() {
        byte[] pdf = appointmentService.exportStatisticsPdf(
                LocalDate.now().minusDays(7), LocalDate.now(), null);
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void getAvailableSlotsForReschedule_doctorMissing_throwsResourceNotFoundException() {
        when(doctorRepository.findById(MISSING)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> appointmentService.getAvailableSlotsForReschedule(
                        MISSING, LocalDate.now(), LocalDate.now().plusDays(7)));
    }
}
