package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Service interface for Revenue Analytics
 */
public interface RevenueService {

    /**
     * Get revenue summary statistics
     */
    RevenueSummaryDTO getRevenueSummary(String from, String to, Boolean compareWithPrevious);

    /**
     * Get revenue breakdown by doctor
     */
    List<DoctorRevenueDTO> getRevenueByDoctor(String from, String to, int top, String sortBy);

    /**
     * Get revenue distribution by payment method
     */
    PaymentMethodRevenueDTO getRevenueByPaymentMethod(String from, String to);

    /**
     * Get revenue breakdown by appointment type
     */
    AppointmentTypeRevenueDTO getRevenueByAppointmentType(String from, String to);

    /**
     * Get time-series revenue data for charts
     */
    RevenueChartDTO getRevenueChartData(String from, String to, String groupBy, Long doctorId);

    /**
     * Export revenue report
     */
    byte[] exportRevenueReport(String from, String to, String format, Boolean includeCharts);

    /**
     * Get refund impact analysis
     */
    RefundAnalysisDTO getRefundAnalysis(String from, String to);

    /**
     * Get drill-down transactions with filters
     */
    Page<DrillDownTransactionDTO> getDrillDownTransactions(
            String from, String to,
            String date, String method, Long doctorId, String appointmentType,
            int page, int size);
}
