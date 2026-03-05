package com.q2k.meditech.controller;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.*;
import com.q2k.meditech.service.SecurityExportService;
import com.q2k.meditech.util.ExportUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller for exporting security & audit data to CSV, Excel, and PDF.
 */
@RestController
@RequestMapping("/admin/security/export")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Security Export", description = "APIs for exporting security data (CSV, Excel, PDF)")
public class AdminSecurityExportController {

    private final SecurityExportService securityExportService;

    // ===================== Audit Logs Export =====================

    @GetMapping("/audit-logs/csv")
    @Operation(summary = "Export audit logs to CSV")
    public ResponseEntity<byte[]> exportAuditLogsCsv(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Action types") @RequestParam(required = false) List<AuditActionType> actionTypes,
            @Parameter(description = "Entity types") @RequestParam(required = false) List<String> entityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) {

        log.info("Export audit logs to CSV");
        AuditLogFilterDTO filter = buildAuditLogFilter(search, actionTypes, entityTypes, userId, from, to);
        byte[] data = securityExportService.exportAuditLogsCsv(filter);
        return buildCsvResponse(data, "audit_logs");
    }

    @GetMapping("/audit-logs/excel")
    @Operation(summary = "Export audit logs to Excel")
    public ResponseEntity<byte[]> exportAuditLogsExcel(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Action types") @RequestParam(required = false) List<AuditActionType> actionTypes,
            @Parameter(description = "Entity types") @RequestParam(required = false) List<String> entityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export audit logs to Excel");
        AuditLogFilterDTO filter = buildAuditLogFilter(search, actionTypes, entityTypes, userId, from, to);
        byte[] data = securityExportService.exportAuditLogsExcel(filter);
        return buildExcelResponse(data, "audit_logs");
    }

    @GetMapping("/audit-logs/pdf")
    @Operation(summary = "Export audit logs to PDF")
    public ResponseEntity<byte[]> exportAuditLogsPdf(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Action types") @RequestParam(required = false) List<AuditActionType> actionTypes,
            @Parameter(description = "Entity types") @RequestParam(required = false) List<String> entityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export audit logs to PDF");
        AuditLogFilterDTO filter = buildAuditLogFilter(search, actionTypes, entityTypes, userId, from, to);
        byte[] data = securityExportService.exportAuditLogsPdf(filter);
        return buildPdfResponse(data, "audit_logs");
    }

    // ===================== Security Events Export =====================

    @GetMapping("/security-events/csv")
    @Operation(summary = "Export security events to CSV")
    public ResponseEntity<byte[]> exportSecurityEventsCsv(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Event types") @RequestParam(required = false) List<SecurityEventType> eventTypes,
            @Parameter(description = "Severities") @RequestParam(required = false) List<SecuritySeverity> severities,
            @Parameter(description = "Status") @RequestParam(required = false) SecurityEventStatus status,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) {

        log.info("Export security events to CSV");
        SecurityEventFilterDTO filter = buildSecurityEventFilter(search, eventTypes, severities, status, userId, from, to);
        byte[] data = securityExportService.exportSecurityEventsCsv(filter);
        return buildCsvResponse(data, "security_events");
    }

    @GetMapping("/security-events/excel")
    @Operation(summary = "Export security events to Excel")
    public ResponseEntity<byte[]> exportSecurityEventsExcel(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Event types") @RequestParam(required = false) List<SecurityEventType> eventTypes,
            @Parameter(description = "Severities") @RequestParam(required = false) List<SecuritySeverity> severities,
            @Parameter(description = "Status") @RequestParam(required = false) SecurityEventStatus status,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export security events to Excel");
        SecurityEventFilterDTO filter = buildSecurityEventFilter(search, eventTypes, severities, status, userId, from, to);
        byte[] data = securityExportService.exportSecurityEventsExcel(filter);
        return buildExcelResponse(data, "security_events");
    }

    @GetMapping("/security-events/pdf")
    @Operation(summary = "Export security events to PDF")
    public ResponseEntity<byte[]> exportSecurityEventsPdf(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Event types") @RequestParam(required = false) List<SecurityEventType> eventTypes,
            @Parameter(description = "Severities") @RequestParam(required = false) List<SecuritySeverity> severities,
            @Parameter(description = "Status") @RequestParam(required = false) SecurityEventStatus status,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export security events to PDF");
        SecurityEventFilterDTO filter = buildSecurityEventFilter(search, eventTypes, severities, status, userId, from, to);
        byte[] data = securityExportService.exportSecurityEventsPdf(filter);
        return buildPdfResponse(data, "security_events");
    }

    // ===================== Activity Logs Export =====================

    @GetMapping("/activity-logs/csv")
    @Operation(summary = "Export activity logs to CSV")
    public ResponseEntity<byte[]> exportActivityLogsCsv(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Activity types") @RequestParam(required = false) List<ActivityType> activityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Resource type") @RequestParam(required = false) String resourceType,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) {

        log.info("Export activity logs to CSV");
        ActivityLogFilterDTO filter = buildActivityLogFilter(search, activityTypes, userId, resourceType, from, to);
        byte[] data = securityExportService.exportActivityLogsCsv(filter);
        return buildCsvResponse(data, "activity_logs");
    }

    @GetMapping("/activity-logs/excel")
    @Operation(summary = "Export activity logs to Excel")
    public ResponseEntity<byte[]> exportActivityLogsExcel(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Activity types") @RequestParam(required = false) List<ActivityType> activityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Resource type") @RequestParam(required = false) String resourceType,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export activity logs to Excel");
        ActivityLogFilterDTO filter = buildActivityLogFilter(search, activityTypes, userId, resourceType, from, to);
        byte[] data = securityExportService.exportActivityLogsExcel(filter);
        return buildExcelResponse(data, "activity_logs");
    }

    @GetMapping("/activity-logs/pdf")
    @Operation(summary = "Export activity logs to PDF")
    public ResponseEntity<byte[]> exportActivityLogsPdf(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Activity types") @RequestParam(required = false) List<ActivityType> activityTypes,
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Resource type") @RequestParam(required = false) String resourceType,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to) throws IOException {

        log.info("Export activity logs to PDF");
        ActivityLogFilterDTO filter = buildActivityLogFilter(search, activityTypes, userId, resourceType, from, to);
        byte[] data = securityExportService.exportActivityLogsPdf(filter);
        return buildPdfResponse(data, "activity_logs");
    }

    // ===================== Helper Methods =====================

    private AuditLogFilterDTO buildAuditLogFilter(String search, List<AuditActionType> actionTypes,
                                                   List<String> entityTypes, Long userId,
                                                   LocalDateTime from, LocalDateTime to) {
        return AuditLogFilterDTO.builder()
                .search(search)
                .actionTypes(actionTypes)
                .entityTypes(entityTypes)
                .userId(userId)
                .from(from)
                .to(to)
                .sortBy("createdAt")
                .sortDir("DESC")
                .pageNumber(0)
                .pageSize(10000)
                .build();
    }

    private SecurityEventFilterDTO buildSecurityEventFilter(String search, List<SecurityEventType> eventTypes,
                                                             List<SecuritySeverity> severities, SecurityEventStatus status,
                                                             Long userId, LocalDateTime from, LocalDateTime to) {
        return SecurityEventFilterDTO.builder()
                .search(search)
                .eventTypes(eventTypes)
                .severities(severities)
                .status(status)
                .userId(userId)
                .from(from)
                .to(to)
                .sortBy("createdAt")
                .sortDir("DESC")
                .pageNumber(0)
                .pageSize(10000)
                .build();
    }

    private ActivityLogFilterDTO buildActivityLogFilter(String search, List<ActivityType> activityTypes,
                                                        Long userId, String resourceType,
                                                        LocalDateTime from, LocalDateTime to) {
        return ActivityLogFilterDTO.builder()
                .search(search)
                .activityTypes(activityTypes)
                .userId(userId)
                .resourceType(resourceType)
                .from(from)
                .to(to)
                .sortBy("createdAt")
                .sortDir("DESC")
                .pageNumber(0)
                .pageSize(10000)
                .build();
    }

    private ResponseEntity<byte[]> buildCsvResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "csv"))
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(data);
    }

    private ResponseEntity<byte[]> buildExcelResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "xlsx"))
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    private ResponseEntity<byte[]> buildPdfResponse(byte[] data, String filenamePrefix) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + ExportUtil.generateFilename(filenamePrefix, "pdf"))
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
