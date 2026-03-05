package com.q2k.meditech.controller;

import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.service.ReceptionistReportExportService;
import com.q2k.meditech.service.ReceptionistReportService;
import com.q2k.meditech.util.ExportUtil;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;

/**
 * Controller for Receptionist Reports (Tab 6).
 * <p>
 * Sub-tabs:
 *   6.1 Daily Appointments Report
 *   6.2 Daily Revenue Summary
 *   6.3 Queue Performance (Today Only)
 * <p>
 * Security: ROLE_RECEPTIONIST required.
 * Export rate-limit: max 10 per user per day.
 */
@Slf4j
@RestController
@RequestMapping("/receptionist/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Reports", description = "Report APIs for receptionist role (Tab 6)")
public class ReceptionistReportController {

    private final ReceptionistReportService reportService;
    private final ReceptionistReportExportService exportService;

    // ============================================================
    //  6.1  Daily Appointments Report
    // ============================================================

    @GetMapping("/daily-appointments")
    @Operation(summary = "Get daily appointments report",
            description = "Appointment list with status summary for a given date. Filter by doctor optional.")
    public ResponseEntity<DailyAppointmentReportDTO> getDailyAppointmentsReport(
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date,
            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId) {

        log.info("GET /receptionist/reports/daily-appointments - date: {}, doctorId: {}", date, doctorId);
        LocalDate reportDate = parseDate(date);
        return ResponseEntity.ok(reportService.getDailyAppointmentReport(reportDate, doctorId));
    }

    @GetMapping("/daily-appointments/export")
    @Operation(summary = "Export daily appointments report",
            description = "Download as PDF, Excel, or CSV. Max 10 exports per day per user.")
    public ResponseEntity<byte[]> exportDailyAppointments(
            @Parameter(description = "Export format: PDF, EXCEL, CSV")
            @RequestParam(defaultValue = "PDF") String format,
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date,
            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId) throws IOException {

        log.info("GET /receptionist/reports/daily-appointments/export - format: {}, date: {}, doctorId: {}", format, date, doctorId);
        checkExportRateLimit();
        LocalDate reportDate = parseDate(date);

        return switch (format.toUpperCase()) {
            case "EXCEL", "XLSX" -> buildExcelResponse(
                    exportService.exportDailyAppointmentsExcel(reportDate, doctorId),
                    "daily_appointments");
            case "CSV" -> buildCsvResponse(
                    exportService.exportDailyAppointmentsCsv(reportDate, doctorId),
                    "daily_appointments");
            default -> buildPdfResponse(
                    exportService.exportDailyAppointmentsPdf(reportDate, doctorId),
                    "daily_appointments");
        };
    }

    // ============================================================
    //  6.2  Daily Revenue Summary
    // ============================================================

    @GetMapping("/daily-revenue")
    @Operation(summary = "Get daily revenue summary",
            description = "Revenue breakdown by payment method, transaction list, and pending payments.")
    public ResponseEntity<DailyRevenueReportDTO> getDailyRevenueReport(
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date) {

        log.info("GET /receptionist/reports/daily-revenue - date: {}", date);
        LocalDate reportDate = parseDate(date);
        return ResponseEntity.ok(reportService.getDailyRevenueReport(reportDate));
    }

    @GetMapping("/daily-revenue/export")
    @Operation(summary = "Export daily revenue summary",
            description = "Download as PDF, Excel, or CSV. Max 10 exports per day per user.")
    public ResponseEntity<byte[]> exportDailyRevenue(
            @Parameter(description = "Export format: PDF, EXCEL, CSV")
            @RequestParam(defaultValue = "PDF") String format,
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date) throws IOException {

        log.info("GET /receptionist/reports/daily-revenue/export - format: {}, date: {}", format, date);
        checkExportRateLimit();
        LocalDate reportDate = parseDate(date);

        return switch (format.toUpperCase()) {
            case "EXCEL", "XLSX" -> buildExcelResponse(
                    exportService.exportDailyRevenueExcel(reportDate),
                    "daily_revenue");
            case "CSV" -> buildCsvResponse(
                    exportService.exportDailyRevenueCsv(reportDate),
                    "daily_revenue");
            default -> buildPdfResponse(
                    exportService.exportDailyRevenuePdf(reportDate),
                    "daily_revenue");
        };
    }

    // ============================================================
    //  6.3  Queue Performance (Today Only)
    // ============================================================

    @GetMapping("/queue-performance")
    @Operation(summary = "Get queue performance report",
            description = "Today's check-in/wait-time metrics per doctor. Today only — no date parameter.")
    public ResponseEntity<QueuePerformanceReportDTO> getQueuePerformanceReport() {

        log.info("GET /receptionist/reports/queue-performance");
        return ResponseEntity.ok(reportService.getQueuePerformanceReport());
    }

    @GetMapping("/queue-performance/export")
    @Operation(summary = "Export queue performance report",
            description = "Download as PDF, Excel, or CSV. Max 10 exports per day per user.")
    public ResponseEntity<byte[]> exportQueuePerformance(
            @Parameter(description = "Export format: PDF, EXCEL, CSV")
            @RequestParam(defaultValue = "PDF") String format) throws IOException {

        log.info("GET /receptionist/reports/queue-performance/export - format: {}", format);
        checkExportRateLimit();

        return switch (format.toUpperCase()) {
            case "EXCEL", "XLSX" -> buildExcelResponse(
                    exportService.exportQueuePerformanceExcel(),
                    "queue_performance");
            case "CSV" -> buildCsvResponse(
                    exportService.exportQueuePerformanceCsv(),
                    "queue_performance");
            default -> buildPdfResponse(
                    exportService.exportQueuePerformancePdf(),
                    "queue_performance");
        };
    }

    // ============================================================
    //  Export quota info
    // ============================================================

    @GetMapping("/export-quota")
    @Operation(summary = "Get remaining export quota",
            description = "Returns how many exports the current user has left today.")
    public ResponseEntity<?> getExportQuota() {
        Long userId = SecurityUtil.getCurrentUserId();
        int remaining = exportService.getRemainingExports(userId);
        return ResponseEntity.ok(java.util.Map.of(
                "remainingExports", remaining,
                "maxPerDay", 10
        ));
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private LocalDate parseDate(String date) {
        if (date == null || date.isBlank()) return null;
        try {
            return LocalDate.parse(date);
        } catch (Exception e) {
            log.warn("Invalid date format: {}, using today", date);
            return LocalDate.now();
        }
    }

    private void checkExportRateLimit() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!exportService.checkAndIncrementExportCount(userId)) {
            throw new RuntimeException("Daily export limit exceeded (max 10). Try again tomorrow.");
        }
    }

    private ResponseEntity<byte[]> buildCsvResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "csv"))
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }

    private ResponseEntity<byte[]> buildExcelResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "xlsx"))
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    private ResponseEntity<byte[]> buildPdfResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "pdf"))
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
