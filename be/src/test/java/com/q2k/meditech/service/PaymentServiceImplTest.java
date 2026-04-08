package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.EndOfDayReportDTO;
import com.q2k.meditech.dto.receptionist.HourlyRevenueDTO;
import com.q2k.meditech.dto.receptionist.PendingPaymentDTO;
import com.q2k.meditech.dto.receptionist.SendPaymentLinkDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock PaymentRepository paymentRepository;
    @Mock PaymentQrRepository paymentQrRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock PrescriptionRepository prescriptionRepository;
    @Mock MedicationInventoryRepository medicationInventoryRepository;
    @Mock MedicationInventoryLogRepository medicationInventoryLogRepository;
    @Mock MedicationRepository medicationRepository;
    @Mock MomoClient momoClient;
    @Mock UserRepository userRepository;
    @Mock InvoiceService invoiceService;
    @Mock InvoiceDeliveryService invoiceDeliveryService;
    @Mock InvoiceRepository invoiceRepository;
    @Mock AuditLogRepository auditLogRepository;
    @Mock SecurityEventRepository securityEventRepository;
    @Mock RefundRepository refundRepository;
    @Mock PaymentStatusWebSocketService paymentStatusWebSocketService;
    @Mock NotificationEventService notificationEventService;
    @Mock EmailService emailService;
    @Mock SmsService smsService;
    @Mock PrivacyMaskingService privacyMaskingService;
    @Mock PlatformTransactionManager transactionManager;
    @Mock ServiceOrderRepository serviceOrderRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks PaymentServiceImpl paymentService;

    private Payment appointmentPayment(long id, String status, String method) {
        User pu = User.builder().fullName("Pat").email("p@x.com").phone("090").build();
        pu.setId(100L);
        Patient patient = Patient.builder().user(pu).fullName("Pat").build();
        patient.setId(200L);
        User du = User.builder().fullName("Dr").build();
        du.setId(300L);
        Doctor doctor = Doctor.builder().id(400L).user(du).specialization("S").consultationFee(new BigDecimal("100000")).build();
        Appointment appt = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(LocalDate.of(2026, 4, 5))
                .appointmentTime(LocalTime.of(9, 0))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .status(AppointmentStatus.CONFIRMED)
                .appointmentCode("APT-1")
                .bookedBy(BookedBy.PATIENT)
                .consultationEndedAt(LocalDateTime.now().minusHours(1))
                .build();
        appt.setId(500L);
        Payment p = Payment.builder()
                .paymentCode("PAY-" + id)
                .appointment(appt)
                .patient(patient)
                .amount(new BigDecimal("100000"))
                .totalAmount(new BigDecimal("100000"))
                .currency("VND")
                .paymentMethod(method)
                .paymentStatus(status)
                .build();
        p.setId(id);
        p.setCreatedAt(LocalDateTime.now().minusDays(1));
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    @Test
    void createPayment_nullUser_throws() {
        assertThatThrownBy(() -> paymentService.createPayment(new PaymentCreateDTO(), null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createPayment_nullAppointmentId_throws() {
        assertThatThrownBy(() -> paymentService.createPayment(new PaymentCreateDTO(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createPayment_appointmentNotFound() {
        PaymentCreateDTO dto = new PaymentCreateDTO();
        dto.setAppointmentId(9L);
        dto.setPaymentMethod("CASH");
        when(appointmentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.createPayment(dto, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createPayment_createsNew() {
        PaymentCreateDTO dto = new PaymentCreateDTO();
        dto.setAppointmentId(500L);
        dto.setPaymentMethod("CASH");
        Payment ap = appointmentPayment(1L, "PENDING", "CASH");
        when(appointmentRepository.findById(500L)).thenReturn(Optional.of(ap.getAppointment()));
        when(paymentRepository.findByAppointmentIdWithDetails(500L)).thenReturn(Optional.empty());
        User proc = User.builder().email("a@b.com").build();
        proc.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(proc));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment x = inv.getArgument(0);
            x.setId(777L);
            return x;
        });
        when(paymentQrRepository.findActiveByPaymentId(anyLong())).thenReturn(Optional.empty());

        PaymentDTO out = paymentService.createPayment(dto, 1L);
        assertThat(out.getId()).isEqualTo(777L);
    }

    @Test
    void createPaymentForAppointment_nullId_throws() {
        assertThatThrownBy(() -> paymentService.createPaymentForAppointment(null, 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createPrescriptionPayment_nullUser_throws() {
        assertThatThrownBy(() -> paymentService.createPrescriptionPayment(new PrescriptionPaymentCreateDTO(), null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createAndInitMomoForServiceOrders_emptyOrders_throws() {
        assertThatThrownBy(() -> paymentService.createAndInitMomoForServiceOrders(1L, List.of(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void initMomoPayment_nullId_throws() {
        assertThatThrownBy(() -> paymentService.initMomoPayment(null, new MomoInitDTO(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getPaymentQr_wrongMethod_throws() {
        Payment p = appointmentPayment(1L, "INITIATED", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.getPaymentQr(1L, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void markPaidCash_nullPaymentId_throws() {
        assertThatThrownBy(() -> paymentService.markPaidCash(null, new MarkCashDTO(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cancelPayment_paid_throws() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.cancelPayment(1L, CancelPaymentDTO.builder().reason("x").build(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void handleMomoWebhook_paymentNotFound() {
        MomoWebhookDTO w = new MomoWebhookDTO();
        w.setOrderId("UNKNOWN");
        when(paymentRepository.findByPaymentCode("UNKNOWN")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.handleMomoWebhook(w)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void handleMockWebhook_failureUpdatesPayment() {
        Payment p = appointmentPayment(2L, "PENDING", "MOMO");
        when(paymentRepository.findByIdWithDetails(2L)).thenReturn(Optional.of(p));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        WebhookMockDTO dto = WebhookMockDTO.builder().paymentId(2L).resultCode(99).status("failed").message("x").build();
        paymentService.handleMockWebhook(dto);
        verify(paymentRepository, atLeastOnce()).save(any());
    }

    @Test
    void updatePaymentStatusSuccess_notFound() {
        when(paymentRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.updatePaymentStatusSuccess(9L, "t"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updatePaymentStatusFailed_notFound() {
        when(paymentRepository.findByIdWithDetails(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.updatePaymentStatusFailed(9L, "m"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPaymentById_null_throws() {
        assertThatThrownBy(() -> paymentService.getPaymentById(null)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getMyPayments_emptyPage() {
        when(paymentRepository.findByPatientIdAndPaymentMethodAndPaymentStatusIn(anyLong(), anyString(), anyList()))
                .thenReturn(List.of());
        when(paymentRepository.findByPatientIdWithAdvancedFilters(anyLong(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        var page = paymentService.getMyPayments(1L, null, null, null, null, 0, 10);
        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void getPaymentByIdForPatient_wrongOwner() {
        Payment p = appointmentPayment(1L, "PENDING", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.getPaymentByIdForPatient(1L, 999L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getPaymentQrForPatient_requiresMomo() {
        Payment p = appointmentPayment(1L, "INITIATED", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.getPaymentQrForPatient(1L, 200L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cancelPaymentForPatient_badStatus() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.cancelPaymentForPatient(1L, 200L, "r"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getAllPayments_mapsPage() {
        when(paymentRepository.findAllWithFilters(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(paymentService.getAllPayments(null, null, null, null, null, null, 0, 10).getContent()).isEmpty();
    }

    @Test
    void adminCancelPayment_invalidStatus() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.adminCancelPayment(1L, CancelPaymentDTO.builder().build(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void expirePayments_dryRun() {
        when(paymentRepository.findPaymentsToExpire(any())).thenReturn(List.of());
        ExpirePaymentsResultDTO r = paymentService.expirePayments(
                ExpirePaymentsDTO.builder().expiryMinutes(60).dryRun(true).build());
        assertThat(r.getExpiredCount()).isZero();
    }

    @Test
    void reconcileMomoStatus_notMomo_throws() {
        Payment p = appointmentPayment(1L, "PENDING", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.reconcileMomoStatus(1L, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getAllPaymentsAdvanced_empty() {
        when(paymentRepository.findAllWithAdvancedFilters(
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(paymentService.getAllPaymentsAdvanced(
                null, null, null, null, null, null, null, null, null, 0, 10, "createdAt", "DESC")
                .getContent()).isEmpty();
    }

    @Test
    void getPaymentStatistics_returnsDto() {
        when(paymentRepository.sumAmountByStatusInDateRange(anyString(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.countCompletedInDateRange(any(), any())).thenReturn(0L);
        when(paymentRepository.countAndSumByPaymentMethodInDateRange(any(), any())).thenReturn(List.of());
        when(paymentRepository.getPendingPaymentsStats()).thenReturn(new Object[]{0, BigDecimal.ZERO});
        when(paymentRepository.getRefundStatsInDateRange(any(), any())).thenReturn(new Object[]{0, BigDecimal.ZERO});
        when(paymentRepository.countByStatusInDateRange(any(), any())).thenReturn(List.of());
        PaymentStatsDTO stats = paymentService.getPaymentStatistics(null, null);
        assertThat(stats).isNotNull();
    }

    @Test
    void bulkMarkAsPaid_userNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.bulkMarkAsPaid(
                BulkMarkPaidDTO.builder().paymentIds(List.of(1L)).paymentMethod("CASH").build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void exportPayments_csv() {
        when(paymentRepository.findAllWithAdvancedFilters(
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        byte[] csv = paymentService.exportPayments(null, null, null, null, null, null, null, null, null, "CSV");
        assertThat(csv.length).isPositive();
    }

    @Test
    void getPaymentDetail_notFound() {
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.getPaymentDetail(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAsPaid_badStatus() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.markAsPaid(1L, MarkPaidDTO.builder().paymentMethod("CASH").build(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void retryPayment_badStatus() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.retryPayment(1L, RetryPaymentDTO.builder().sendVia("EMAIL").build(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getPaymentHistory_buildsEvents() {
        Payment p = appointmentPayment(3L, "PENDING", "CASH");
        when(paymentRepository.findByIdWithDetails(3L)).thenReturn(Optional.of(p));
        PaymentHistoryDTO h = paymentService.getPaymentHistory(3L);
        assertThat(h.getEvents()).isNotEmpty();
    }

    @Test
    void getPendingPayments_masksPhone() {
        Payment p = appointmentPayment(4L, "PENDING", "CASH");
        when(paymentRepository.findPendingPayments(isNull(), any())).thenReturn(new PageImpl<>(List.of(p)));
        when(privacyMaskingService.maskPhone(any())).thenReturn("090****");
        var page = paymentService.getPendingPayments(null, 0, 10, "createdAt", "ASC");
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void sendPaymentLink_badStatus() {
        Payment p = appointmentPayment(1L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> paymentService.sendPaymentLink(1L, SendPaymentLinkDTO.builder().sendVia("EMAIL").build(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getHourlyRevenue_parsesDate() {
        when(paymentRepository.getHourlyRevenue(any(), any())).thenReturn(List.of());
        HourlyRevenueDTO dto = paymentService.getHourlyRevenue("2026-04-05");
        assertThat(dto.getDate()).isEqualTo(LocalDate.of(2026, 4, 5));
    }

    @Test
    void generateEndOfDayReport_builds() {
        when(paymentRepository.findPaidPaymentsForDate(any(), any())).thenReturn(List.of());
        when(paymentRepository.countPendingPaymentsWithCompletedAppointment()).thenReturn(new Object[]{0, BigDecimal.ZERO});
        EndOfDayReportDTO r = paymentService.generateEndOfDayReport("2026-04-05", null);
        assertThat(r.getReportDate()).isEqualTo(LocalDate.of(2026, 4, 5));
    }

    @Test
    void exportEndOfDayReport_text() {
        when(paymentRepository.findPaidPaymentsForDate(any(), any())).thenReturn(List.of());
        when(paymentRepository.countPendingPaymentsWithCompletedAppointment()).thenReturn(new Object[]{0, BigDecimal.ZERO});
        byte[] bytes = paymentService.exportEndOfDayReport("2026-04-05", "TXT", null);
        assertThat(bytes.length).isPositive();
    }

    @Test
    void refundPayment_notPaid_throws() {
        Payment p = appointmentPayment(1L, "PENDING", "CASH");
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(p));
        HttpServletRequest req = mock(HttpServletRequest.class);
        try (MockedStatic<RequestContextHolder> rc = mockStatic(RequestContextHolder.class)) {
            rc.when(RequestContextHolder::getRequestAttributes).thenReturn(new ServletRequestAttributes(req));
            when(req.getRemoteAddr()).thenReturn("127.0.0.1");
            assertThatThrownBy(() -> paymentService.refundPayment(1L, RefundDTO.builder().refundAmount(BigDecimal.ONE).build(), 1L))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void downloadReceipt_generatesPdf() {
        Payment p = appointmentPayment(6L, "PAID", "CASH");
        p.setPaidAt(LocalDateTime.now());
        when(paymentRepository.findByIdWithDetails(6L)).thenReturn(Optional.of(p));
        byte[] pdf = paymentService.downloadReceipt(6L);
        assertThat(pdf.length).isGreaterThan(100);
    }

    @Test
    void sendReceipt_returnsMessage() {
        Payment p = appointmentPayment(7L, "PAID", "CASH");
        when(paymentRepository.findByIdWithDetails(7L)).thenReturn(Optional.of(p));
        Invoice inv = Invoice.builder().id(55L).build();
        when(invoiceRepository.findByPaymentIdWithDetails(7L)).thenReturn(Optional.of(inv));
        MessageDTO m = paymentService.sendReceipt(7L, SendReceiptDTO.builder().email("x@y.com").build(), 1L);
        assertThat(m.getSuccess()).isTrue();
    }
}
