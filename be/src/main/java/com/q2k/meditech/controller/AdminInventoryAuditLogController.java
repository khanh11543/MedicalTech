package com.q2k.meditech.controller;

import com.q2k.meditech.dto.InventoryAuditStatsDTO;
import com.q2k.meditech.dto.InventoryLogDTO;
import com.q2k.meditech.service.InventoryAuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/inventory-audit-logs")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Inventory Audit Logs", description = "APIs for viewing inventory change audit trail")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryAuditLogController {

    private final InventoryAuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "List all inventory audit logs with filters")
    public ResponseEntity<Page<InventoryLogDTO>> getAuditLogs(
            @RequestParam(required = false) Long medicationId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "changedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("Admin fetching inventory audit logs - action: {}, medicationId: {}, refType: {}",
                action, medicationId, referenceType);

        return ResponseEntity.ok(auditLogService.getAuditLogs(
                medicationId, action, referenceType, userId,
                from, to, search, page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inventory audit log detail")
    public ResponseEntity<InventoryLogDTO> getAuditLogDetail(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getAuditLogDetail(id));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get inventory audit log statistics")
    public ResponseEntity<InventoryAuditStatsDTO> getAuditStats() {
        return ResponseEntity.ok(auditLogService.getAuditStats());
    }
}
