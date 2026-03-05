package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.RevenueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin Revenue Controller
 * Base path: /api/admin/revenue
 * 
 * APIs for revenue analytics and reports
 * All endpoints require ADMIN role
 * 
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/revenue")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Revenue Analytics", description = "APIs for revenue analytics and reports")
public class AdminRevenueController {

    private final RevenueService revenueService;

    /**
     * GET /api/admin/revenue/summary
     * Get revenue summary statistics
     */
    @GetMapping("/summary")
    @Operation(
        summary = "Get revenue summary",
        description = "Get revenue summary statistics including total revenue, transactions, growth metrics, and daily averages"
    )
    public ResponseEntity<RevenueSummaryDTO> getRevenueSummary(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to,
            @Parameter(description = "Compare with previous period")
            @RequestParam(defaultValue = "false") Boolean compareWithPrevious) {

        log.info("GET /admin/revenue/summary - from: {}, to: {}, compare: {}", from, to, compareWithPrevious);

        RevenueSummaryDTO summary = revenueService.getRevenueSummary(from, to, compareWithPrevious);

        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/admin/revenue/by-doctor
     * Get revenue breakdown by doctor
     */
    @GetMapping("/by-doctor")
    @Operation(
        summary = "Get revenue by doctor",
        description = "Get revenue breakdown by doctor with ranking, including transaction count, average fee, and refund statistics"
    )
    public ResponseEntity<List<DoctorRevenueDTO>> getRevenueByDoctor(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to,
            @Parameter(description = "Number of top doctors to return")
            @RequestParam(defaultValue = "10") int top,
            @Parameter(description = "Sort by: totalRevenue, transactionCount, avgFee")
            @RequestParam(defaultValue = "totalRevenue") String sortBy) {

        log.info("GET /admin/revenue/by-doctor - from: {}, to: {}, top: {}, sortBy: {}", from, to, top, sortBy);

        List<DoctorRevenueDTO> revenue = revenueService.getRevenueByDoctor(from, to, top, sortBy);

        return ResponseEntity.ok(revenue);
    }

    /**
     * GET /api/admin/revenue/by-method
     * Get revenue distribution by payment method
     */
    @GetMapping("/by-method")
    @Operation(
        summary = "Get revenue by payment method",
        description = "Get revenue distribution by payment method with success rates and transaction counts"
    )
    public ResponseEntity<PaymentMethodRevenueDTO> getRevenueByPaymentMethod(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to) {

        log.info("GET /admin/revenue/by-method - from: {}, to: {}", from, to);

        PaymentMethodRevenueDTO revenue = revenueService.getRevenueByPaymentMethod(from, to);

        return ResponseEntity.ok(revenue);
    }

    /**
     * GET /api/admin/revenue/by-appointment-type
     * Get revenue breakdown by appointment type
     */
    @GetMapping("/by-appointment-type")
    @Operation(
        summary = "Get revenue by appointment type",
        description = "Get revenue breakdown by appointment type with completion rates"
    )
    public ResponseEntity<AppointmentTypeRevenueDTO> getRevenueByAppointmentType(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to) {

        log.info("GET /admin/revenue/by-appointment-type - from: {}, to: {}", from, to);

        AppointmentTypeRevenueDTO revenue = revenueService.getRevenueByAppointmentType(from, to);

        return ResponseEntity.ok(revenue);
    }

    /**
     * GET /api/admin/revenue/chart
     * Get time-series revenue data for charts
     */
    @GetMapping("/chart")
    @Operation(
        summary = "Get revenue chart data",
        description = "Get time-series revenue data for charts, grouped by day, week, or month"
    )
    public ResponseEntity<RevenueChartDTO> getRevenueChartData(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to,
            @Parameter(description = "Group by: DAY, WEEK, MONTH")
            @RequestParam(defaultValue = "DAY") String groupBy,
            @Parameter(description = "Filter by doctor ID (optional)")
            @RequestParam(required = false) Long doctorId) {

        log.info("GET /admin/revenue/chart - from: {}, to: {}, groupBy: {}, doctorId: {}", 
                from, to, groupBy, doctorId);

        RevenueChartDTO chartData = revenueService.getRevenueChartData(from, to, groupBy, doctorId);

        return ResponseEntity.ok(chartData);
    }

    /**
     * GET /api/admin/revenue/export
     * Export comprehensive revenue report
     */
    @GetMapping("/export")
    @Operation(
        summary = "Export revenue report",
        description = "Export comprehensive revenue report in PDF or Excel format"
    )
    public ResponseEntity<byte[]> exportRevenueReport(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to,
            @Parameter(description = "Export format: PDF, EXCEL")
            @RequestParam(defaultValue = "PDF") String format,
            @Parameter(description = "Include charts in report")
            @RequestParam(defaultValue = "true") Boolean includeCharts) {

        log.info("GET /admin/revenue/export - from: {}, to: {}, format: {}", from, to, format);

        byte[] report = revenueService.exportRevenueReport(from, to, format, includeCharts);

        // Determine content type and filename
        String contentType;
        String filename;
        String extension;

        if ("EXCEL".equalsIgnoreCase(format)) {
            contentType = "text/csv";
            extension = "csv";
            filename = String.format("revenue_report_%s_%s.%s", from, to, extension);
        } else {
            contentType = "text/plain";
            extension = "txt";
            filename = String.format("revenue_report_%s_%s.%s", from, to, extension);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(report);
    }

    /**
     * GET /api/admin/revenue/refund-analysis
     * Get refund impact analysis
     */
    @GetMapping("/refund-analysis")
    @Operation(
        summary = "Get refund analysis",
        description = "Get comprehensive refund impact analysis including reason distribution, trends, and rate trends"
    )
    public ResponseEntity<RefundAnalysisDTO> getRefundAnalysis(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to) {

        log.info("GET /admin/revenue/refund-analysis - from: {}, to: {}", from, to);

        RefundAnalysisDTO analysis = revenueService.getRefundAnalysis(from, to);

        return ResponseEntity.ok(analysis);
    }

    /**
     * GET /api/admin/revenue/drill-down
     * Get drill-down transaction list (paginated)
     */
    @GetMapping("/drill-down")
    @Operation(
        summary = "Get drill-down transactions",
        description = "Get paginated transaction list filtered by date, method, doctor, or appointment type"
    )
    public ResponseEntity<Page<DrillDownTransactionDTO>> getDrillDownTransactions(
            @Parameter(description = "From date (yyyy-MM-dd)", required = true)
            @RequestParam String from,
            @Parameter(description = "To date (yyyy-MM-dd)", required = true)
            @RequestParam String to,
            @Parameter(description = "Specific date to drill into (yyyy-MM-dd)")
            @RequestParam(required = false) String date,
            @Parameter(description = "Filter by payment method")
            @RequestParam(required = false) String method,
            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Filter by appointment type")
            @RequestParam(required = false) String appointmentType,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "15") int size) {

        log.info("GET /admin/revenue/drill-down - from: {}, to: {}, date: {}, method: {}, doctorId: {}, type: {}",
                from, to, date, method, doctorId, appointmentType);

        Page<DrillDownTransactionDTO> transactions = revenueService.getDrillDownTransactions(
                from, to, date, method, doctorId, appointmentType, page, size);

        return ResponseEntity.ok(transactions);
    }

    /**
     * GET /api/admin/revenue/scheduled-reports
     * List scheduled reports (stub — feature coming soon)
     */
    @GetMapping("/scheduled-reports")
    @Operation(summary = "List scheduled reports", description = "Placeholder: returns empty list until scheduling feature is implemented")
    public ResponseEntity<List<?>> getScheduledReports() {
        log.info("GET /admin/revenue/scheduled-reports (stub)");
        return ResponseEntity.ok(List.of());
    }

    /**
     * POST /api/admin/revenue/scheduled-reports
     * Create scheduled report (stub)
     */
    @PostMapping("/scheduled-reports")
    @Operation(summary = "Create scheduled report", description = "Placeholder: scheduling feature coming soon")
    public ResponseEntity<Object> createScheduledReport(@RequestBody Object body) {
        log.info("POST /admin/revenue/scheduled-reports (stub)");
        return ResponseEntity.status(501).body(
                java.util.Map.of("message", "Scheduled reports feature is coming soon"));
    }

    /**
     * DELETE /api/admin/revenue/scheduled-reports/{id}
     * Delete scheduled report (stub)
     */
    @DeleteMapping("/scheduled-reports/{id}")
    @Operation(summary = "Delete scheduled report", description = "Placeholder: scheduling feature coming soon")
    public ResponseEntity<Object> deleteScheduledReport(@PathVariable Long id) {
        log.info("DELETE /admin/revenue/scheduled-reports/{} (stub)", id);
        return ResponseEntity.status(501).body(
                java.util.Map.of("message", "Scheduled reports feature is coming soon"));
    }
}
