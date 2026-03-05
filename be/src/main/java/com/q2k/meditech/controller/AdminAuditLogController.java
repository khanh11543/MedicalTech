package com.q2k.meditech.controller;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.AuditActionType;
import com.q2k.meditech.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/security/audit-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Audit Trail", description = "APIs for viewing audit logs (10.3)")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "List audit logs", description = "Get paginated list of audit logs with filters")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogs(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Action types filter") @RequestParam(required = false) List<AuditActionType> actionTypes,
            @Parameter(description = "Entity types filter") @RequestParam(required = false) List<String> entityTypes,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by entity ID") @RequestParam(required = false) Long entityId,
            @Parameter(description = "Filter by IP address") @RequestParam(required = false) String ipAddress,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/audit-logs - search: {}, userId: {}", search, userId);
        AuditLogFilterDTO filter = AuditLogFilterDTO.builder()
                .search(search)
                .actionTypes(actionTypes)
                .entityTypes(entityTypes)
                .userId(userId)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(auditLogService.getAuditLogs(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get audit log detail", description = "Get detailed audit log with field-level changes and related logs")
    public ResponseEntity<AuditLogDetailDTO> getAuditLogDetail(
            @Parameter(description = "Audit log ID") @PathVariable Long id) {
        log.info("GET /admin/security/audit-logs/{}", id);
        return ResponseEntity.ok(auditLogService.getAuditLogDetail(id));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get audit log statistics", description = "Get statistics for audit logs in a period")
    public ResponseEntity<AuditLogStatsDTO> getStats(
            @Parameter(description = "Period: 24h, 7d, 30d, 90d") @RequestParam(defaultValue = "24h") String period) {
        log.info("GET /admin/security/audit-logs/stats - period: {}", period);
        return ResponseEntity.ok(auditLogService.getAuditLogStats(period));
    }
}
