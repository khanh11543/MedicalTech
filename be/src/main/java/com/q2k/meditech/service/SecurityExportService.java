package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.util.ExportUtil;
import com.q2k.meditech.util.ExportUtil.ExportColumn;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

/**
 * Service for exporting security & audit data to CSV, Excel, and PDF formats.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityExportService {

    private final AuditLogService auditLogService;
    private final SecurityEventService securityEventService;
    private final ActivityLogService activityLogService;

    // ===================== Audit Logs =====================

    public byte[] exportAuditLogsCsv(AuditLogFilterDTO filter) {
        List<AuditLogDTO> data = fetchAllAuditLogs(filter);
        return ExportUtil.toCsv(auditLogColumns(), data);
    }

    public byte[] exportAuditLogsExcel(AuditLogFilterDTO filter) throws IOException {
        List<AuditLogDTO> data = fetchAllAuditLogs(filter);
        return ExportUtil.toExcel(auditLogColumns(), data, "Audit Logs");
    }

    public byte[] exportAuditLogsPdf(AuditLogFilterDTO filter) throws IOException {
        List<AuditLogDTO> data = fetchAllAuditLogs(filter);
        return ExportUtil.toPdf(auditLogColumns(), data, "Audit Logs Report");
    }

    private List<AuditLogDTO> fetchAllAuditLogs(AuditLogFilterDTO filter) {
        filter.setPageNumber(0);
        filter.setPageSize(10000);
        Page<AuditLogDTO> page = auditLogService.getAuditLogs(filter);
        return page.getContent();
    }

    private List<ExportColumn<AuditLogDTO>> auditLogColumns() {
        return List.of(
                ExportColumn.of("ID", dto -> ExportUtil.safeToString(dto.getId())),
                ExportColumn.of("Action", AuditLogDTO::getAction),
                ExportColumn.of("Action Type", dto -> ExportUtil.safeToString(dto.getActionType())),
                ExportColumn.of("Entity Type", AuditLogDTO::getEntityType),
                ExportColumn.of("Entity ID", dto -> ExportUtil.safeToString(dto.getEntityId())),
                ExportColumn.of("User", dto -> dto.getUser() != null ? dto.getUser().getFullName() : ""),
                ExportColumn.of("IP Address", AuditLogDTO::getIpAddress),
                ExportColumn.of("Country", AuditLogDTO::getGeoCountry),
                ExportColumn.of("Request URL", AuditLogDTO::getRequestUrl),
                ExportColumn.of("Created At", dto -> ExportUtil.formatDateTime(dto.getCreatedAt()))
        );
    }

    // ===================== Security Events =====================

    public byte[] exportSecurityEventsCsv(SecurityEventFilterDTO filter) {
        List<SecurityEventDTO> data = fetchAllSecurityEvents(filter);
        return ExportUtil.toCsv(securityEventColumns(), data);
    }

    public byte[] exportSecurityEventsExcel(SecurityEventFilterDTO filter) throws IOException {
        List<SecurityEventDTO> data = fetchAllSecurityEvents(filter);
        return ExportUtil.toExcel(securityEventColumns(), data, "Security Events");
    }

    public byte[] exportSecurityEventsPdf(SecurityEventFilterDTO filter) throws IOException {
        List<SecurityEventDTO> data = fetchAllSecurityEvents(filter);
        return ExportUtil.toPdf(securityEventColumns(), data, "Security Events Report");
    }

    private List<SecurityEventDTO> fetchAllSecurityEvents(SecurityEventFilterDTO filter) {
        filter.setPageNumber(0);
        filter.setPageSize(10000);
        Page<SecurityEventDTO> page = securityEventService.getSecurityEvents(filter);
        return page.getContent();
    }

    private List<ExportColumn<SecurityEventDTO>> securityEventColumns() {
        return List.of(
                ExportColumn.of("ID", dto -> ExportUtil.safeToString(dto.getId())),
                ExportColumn.of("Event Type", dto -> ExportUtil.safeToString(dto.getEventType())),
                ExportColumn.of("Severity", dto -> ExportUtil.safeToString(dto.getSeverity())),
                ExportColumn.of("Status", dto -> ExportUtil.safeToString(dto.getStatus())),
                ExportColumn.of("Description", SecurityEventDTO::getDescription),
                ExportColumn.of("User", dto -> dto.getUser() != null ? dto.getUser().getFullName() : ""),
                ExportColumn.of("IP Address", SecurityEventDTO::getIpAddress),
                ExportColumn.of("Country", SecurityEventDTO::getGeoCountry),
                ExportColumn.of("City", SecurityEventDTO::getGeoCity),
                ExportColumn.of("Created At", dto -> ExportUtil.formatDateTime(dto.getCreatedAt())),
                ExportColumn.of("Resolved At", dto -> ExportUtil.formatDateTime(dto.getResolvedAt()))
        );
    }

    // ===================== Activity Logs =====================

    public byte[] exportActivityLogsCsv(ActivityLogFilterDTO filter) {
        List<ActivityLogDTO> data = fetchAllActivityLogs(filter);
        return ExportUtil.toCsv(activityLogColumns(), data);
    }

    public byte[] exportActivityLogsExcel(ActivityLogFilterDTO filter) throws IOException {
        List<ActivityLogDTO> data = fetchAllActivityLogs(filter);
        return ExportUtil.toExcel(activityLogColumns(), data, "Activity Logs");
    }

    public byte[] exportActivityLogsPdf(ActivityLogFilterDTO filter) throws IOException {
        List<ActivityLogDTO> data = fetchAllActivityLogs(filter);
        return ExportUtil.toPdf(activityLogColumns(), data, "Activity Logs Report");
    }

    private List<ActivityLogDTO> fetchAllActivityLogs(ActivityLogFilterDTO filter) {
        filter.setPageNumber(0);
        filter.setPageSize(10000);
        Page<ActivityLogDTO> page = activityLogService.getActivityLogs(filter);
        return page.getContent();
    }

    private List<ExportColumn<ActivityLogDTO>> activityLogColumns() {
        return List.of(
                ExportColumn.of("ID", dto -> ExportUtil.safeToString(dto.getId())),
                ExportColumn.of("Activity Type", dto -> ExportUtil.safeToString(dto.getActivityType())),
                ExportColumn.of("Description", ActivityLogDTO::getDescription),
                ExportColumn.of("User", dto -> dto.getUser() != null ? dto.getUser().getFullName() : ""),
                ExportColumn.of("Resource Type", ActivityLogDTO::getResourceType),
                ExportColumn.of("Resource ID", dto -> ExportUtil.safeToString(dto.getResourceId())),
                ExportColumn.of("IP Address", ActivityLogDTO::getIpAddress),
                ExportColumn.of("Country", ActivityLogDTO::getGeoCountry),
                ExportColumn.of("Created At", dto -> ExportUtil.formatDateTime(dto.getCreatedAt()))
        );
    }
}
