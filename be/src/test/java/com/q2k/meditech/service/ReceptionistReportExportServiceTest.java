package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceptionistReportExportServiceTest {

    @Mock private ReceptionistReportService reportService;

    @InjectMocks
    private ReceptionistReportExportService service;

    private DailyAppointmentReportDTO sampleAppointmentReport() {
        return DailyAppointmentReportDTO.builder()
                .reportDate(LocalDate.now())
                .branch("B")
                .generatedBy("U")
                .appointments(List.of(DailyAppointmentReportDTO.AppointmentRow.builder()
                        .queueNumber(1).appointmentCode("A").startTime(LocalTime.NOON).endTime(LocalTime.NOON)
                        .patientName("P").maskedPhone("m").doctorName("D").room("1").status("OK")
                        .paymentStatus("PAID")
                        .build()))
                .summary(DailyAppointmentReportDTO.SummarySection.builder()
                        .totalAppointments(1).confirmed(1).checkedIn(0).inProgress(0).completed(0)
                        .cancelled(0).noShow(0).pending(0).rescheduled(0).completionRate(100).build())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private DailyRevenueReportDTO sampleRevenueReport() {
        return DailyRevenueReportDTO.builder()
                .reportDate(LocalDate.now()).branch("B").generatedBy("U")
                .totalRevenue(BigDecimal.TEN).cashTotal(BigDecimal.TEN).cashTransactions(1)
                .momoTotal(BigDecimal.ZERO).momoTransactions(0)
                .pendingPaymentsCount(0).pendingPaymentsAmount(BigDecimal.ZERO)
                .transactions(List.of()).pendingPayments(List.of())
                .cashDrawerExpectedBalance(BigDecimal.TEN)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private QueuePerformanceReportDTO sampleQueueReport() {
        return QueuePerformanceReportDTO.builder()
                .reportDate(LocalDate.now()).branch("B").generatedBy("U")
                .totalCheckedIn(0).avgWaitMinutes(0).longestWaitMinutes(0)
                .noShowRate(0).noShowCount(0).totalScheduled(0)
                .byDoctor(List.of())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void exportDailyAppointmentsCsv() {
        when(reportService.getDailyAppointmentReport(any(), any())).thenReturn(sampleAppointmentReport());
        assertThat(service.exportDailyAppointmentsCsv(LocalDate.now(), null).length).isPositive();
    }

    @Test
    void exportDailyAppointmentsExcel() throws IOException {
        when(reportService.getDailyAppointmentReport(any(), any())).thenReturn(sampleAppointmentReport());
        assertThat(service.exportDailyAppointmentsExcel(LocalDate.now(), null).length).isPositive();
    }

    @Test
    void exportDailyAppointmentsPdf() throws IOException {
        when(reportService.getDailyAppointmentReport(any(), any())).thenReturn(sampleAppointmentReport());
        assertThat(service.exportDailyAppointmentsPdf(LocalDate.now(), null).length).isPositive();
    }

    @Test
    void exportDailyRevenueCsv() {
        when(reportService.getDailyRevenueReport(any())).thenReturn(sampleRevenueReport());
        assertThat(service.exportDailyRevenueCsv(LocalDate.now()).length).isPositive();
    }

    @Test
    void exportDailyRevenueExcel() throws IOException {
        when(reportService.getDailyRevenueReport(any())).thenReturn(sampleRevenueReport());
        assertThat(service.exportDailyRevenueExcel(LocalDate.now()).length).isPositive();
    }

    @Test
    void exportDailyRevenuePdf() throws IOException {
        when(reportService.getDailyRevenueReport(any())).thenReturn(sampleRevenueReport());
        assertThat(service.exportDailyRevenuePdf(LocalDate.now()).length).isPositive();
    }

    @Test
    void exportQueuePerformanceCsv() {
        when(reportService.getQueuePerformanceReport()).thenReturn(sampleQueueReport());
        assertThat(service.exportQueuePerformanceCsv().length).isPositive();
    }

    @Test
    void exportQueuePerformanceExcel() throws IOException {
        when(reportService.getQueuePerformanceReport()).thenReturn(sampleQueueReport());
        assertThat(service.exportQueuePerformanceExcel().length).isPositive();
    }

    @Test
    void exportQueuePerformancePdf() throws IOException {
        when(reportService.getQueuePerformanceReport()).thenReturn(sampleQueueReport());
        assertThat(service.exportQueuePerformancePdf().length).isPositive();
    }

    @Test
    void checkAndIncrementExportCount() {
        assertThat(service.checkAndIncrementExportCount(1L)).isTrue();
        assertThat(service.getRemainingExports(1L)).isLessThanOrEqualTo(10);
    }
}
