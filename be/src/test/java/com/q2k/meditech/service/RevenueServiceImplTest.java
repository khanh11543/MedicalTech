package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.RefundRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private RefundRepository refundRepository;

    @InjectMocks
    private RevenueServiceImpl service;

    @Test
    void getRevenueSummary_basic() {
        Object[] row = new Object[]{5L, BigDecimal.valueOf(100), BigDecimal.valueOf(20)};
        when(paymentRepository.getRevenueSummary(any(), any())).thenReturn(row);
        when(paymentRepository.getRefundStatsInDateRange(any(), any())).thenReturn(new Object[]{0L, BigDecimal.ZERO});
        when(paymentRepository.sumAmountByStatusInDateRange(eq("PENDING"), any(), any())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.sumAmountByStatusInDateRange(eq("FAILED"), any(), any())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.getPeakRevenueDay(any(), any())).thenReturn(List.of());

        RevenueSummaryDTO s = service.getRevenueSummary("2025-01-01", "2025-01-31", false);
        assertThat(s.getTotalTransactions()).isEqualTo(5L);
        assertThat(s.getTotalRevenue()).isEqualByComparingTo("100");
    }

    @Test
    void getRevenueSummary_invalidDate_throws() {
        assertThatThrownBy(() -> service.getRevenueSummary("", "2025-01-10", false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getRevenueByDoctor_empty() {
        when(paymentRepository.getRevenueByDoctor(any(), any())).thenReturn(List.of());
        assertThat(service.getRevenueByDoctor("2025-01-01", "2025-01-31", 5, "totalRevenue")).isEmpty();
    }

    @Test
    void getRevenueByPaymentMethod_empty() {
        when(paymentRepository.getRevenueByMethodWithStatus(any(), any())).thenReturn(List.of());
        PaymentMethodRevenueDTO d = service.getRevenueByPaymentMethod("2025-01-01", "2025-01-10");
        assertThat(d.getTotalRevenue()).isEqualByComparingTo("0");
    }

    @Test
    void getRevenueByAppointmentType_empty() {
        when(paymentRepository.getRevenueByAppointmentType(any(), any())).thenReturn(List.of());
        when(paymentRepository.getAppointmentStatusByType(any(), any())).thenReturn(List.of());
        assertThat(service.getRevenueByAppointmentType("2025-01-01", "2025-01-10").getTotalRevenue())
                .isEqualByComparingTo("0");
    }

    @Test
    void getRevenueChartData_empty() {
        when(paymentRepository.getDailyRevenue(any(), any(), isNull())).thenReturn(List.of());
        when(paymentRepository.getDailyRefunds(any(), any(), isNull())).thenReturn(List.of());
        RevenueChartDTO c = service.getRevenueChartData("2025-01-01", "2025-01-05", "DAY", null);
        assertThat(c.getDataPoints()).isEmpty();
    }

    @Test
    void exportRevenueReport_returnsBytes() {
        Object[] row = new Object[]{1L, BigDecimal.TEN, BigDecimal.TEN};
        // export calls getRevenueSummary(..., true) — second window also queries getRevenueSummary
        when(paymentRepository.getRevenueSummary(any(), any())).thenReturn(row);
        when(paymentRepository.getRefundStatsInDateRange(any(), any())).thenReturn(new Object[]{0L, BigDecimal.ZERO});
        when(paymentRepository.sumAmountByStatusInDateRange(anyString(), any(), any())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.getPeakRevenueDay(any(), any())).thenReturn(List.of());
        when(paymentRepository.getRevenueByDoctor(any(), any())).thenReturn(List.of());
        when(paymentRepository.getRefundByDoctor(any(), any())).thenReturn(List.of());
        when(paymentRepository.getAppointmentCountByDoctor(any(), any())).thenReturn(List.of());
        when(paymentRepository.getRevenueByMethodWithStatus(any(), any())).thenReturn(List.of());
        when(paymentRepository.getRevenueByAppointmentType(any(), any())).thenReturn(List.of());
        when(paymentRepository.getAppointmentStatusByType(any(), any())).thenReturn(List.of());

        assertThat(service.exportRevenueReport("2025-01-01", "2025-01-05", "EXCEL", false).length).isPositive();
    }

    @Test
    void getRefundAnalysis() {
        when(refundRepository.countCompletedInDateRange(any(), any())).thenReturn(0L);
        when(refundRepository.sumCompletedRefundAmountInDateRange(any(), any())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.countCompletedInDateRange(any(), any())).thenReturn(1L);
        when(refundRepository.getRefundByReasonInDateRange(any(), any())).thenReturn(List.of());
        when(refundRepository.getDailyRefundTrend(any(), any())).thenReturn(List.of());
        when(paymentRepository.countPaidPerDayInDateRange(any(), any())).thenReturn(List.of());

        RefundAnalysisDTO a = service.getRefundAnalysis("2025-01-01", "2025-01-10");
        assertThat(a.getRefundCount()).isZero();
    }

    @Test
    void getDrillDownTransactions() {
        Pageable p = PageRequest.of(0, 5);
        when(paymentRepository.findForDrillDown(any(), any(), isNull(), isNull(), isNull(), eq(p)))
                .thenReturn(Page.empty(p));

        Page<DrillDownTransactionDTO> page = service.getDrillDownTransactions(
                "2025-01-01", "2025-01-31", null, null, null, null, 0, 5);
        assertThat(page.getContent()).isEmpty();
    }
}
