package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.ExportUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceImplTest {

    @Mock RefundRepository refundRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock UserRepository userRepository;
    @Mock AuditLogRepository auditLogRepository;
    @Mock PrescriptionRepository prescriptionRepository;
    @Mock MedicationInventoryRepository medicationInventoryRepository;
    @Mock MedicationInventoryLogRepository medicationInventoryLogRepository;

    @InjectMocks RefundServiceImpl service;

    @BeforeEach
    void defaultStatsStubs() {
        lenient().when(refundRepository.countByStatusInDateRange(any(), any(), any())).thenReturn(0L);
        lenient().when(refundRepository.countInDateRange(any(), any())).thenReturn(0L);
        lenient().when(refundRepository.sumRefundAmountInDateRange(any(), any())).thenReturn(BigDecimal.ZERO);
        lenient().when(refundRepository.sumRefundAmountByStatusInDateRange(any(), any(), any())).thenReturn(BigDecimal.ZERO);
        lenient().when(paymentRepository.countCompletedInDateRange(any(), any())).thenReturn(0L);
        lenient().when(refundRepository.countAndSumByPaymentMethodInDateRange(any(), any())).thenReturn(List.of());
        lenient().when(refundRepository.findAllWithFilters(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));
    }

    @Test
    void getAllRefunds_emptyPage() {
        assertThat(service.getAllRefunds(null, null, null, null, null, null, null, null, null, null,
                0, 20, "requestedDate", "DESC").getContent()).isEmpty();
    }

    @Test
    void getRefundStatistics() {
        assertThat(service.getRefundStatistics("2026-01-01", "2026-01-31").getTotalRefunds()).isZero();
    }

    @Test
    void exportRefunds_csv() {
        try (MockedStatic<ExportUtil> eu = mockStatic(ExportUtil.class)) {
            eu.when(() -> ExportUtil.toCsv(anyList(), anyList())).thenReturn(new byte[]{1, 2, 3});
            byte[] out = service.exportRefunds(null, null, null, null, null, null, null, null, null, null,
                    "requestedDate", "DESC", "CSV");
            assertThat(out).isNotEmpty();
        }
    }

    @Test
    void getRefundDetail_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.getRefundDetail(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createRefundRequest_paymentNotFound() {
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        RefundDTO dto = RefundDTO.builder()
                .refundAmount(BigDecimal.TEN)
                .refundReasonType("OTHER")
                .refundMethod("ORIGINAL_METHOD")
                .refundType("MANUAL")
                .build();
        assertThatThrownBy(() -> service.createRefundRequest(1L, dto, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void approveRefund_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.approveRefund(1L, ApproveRefundDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void processRefund_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.processRefund(1L, ProcessRefundDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void rejectRefund_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.rejectRefund(1L, RejectRefundDTO.builder().rejectionReason("x").build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void retryRefund_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.retryRefund(1L, RetryRefundDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markRefundFailed_notFound() {
        when(refundRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.markRefundFailed(1L, "reason", 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
