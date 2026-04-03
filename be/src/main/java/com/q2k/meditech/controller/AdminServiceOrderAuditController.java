package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ServiceOrderAuditLogDTO;
import com.q2k.meditech.dto.ServiceOrderAuditLogDetailDTO;
import com.q2k.meditech.dto.ServiceOrderAuditLogFilterDTO;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/service-order-audit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Service Order Audit", description = "Audit logs for the Service Order workflow")
@PreAuthorize("hasRole('ADMIN')")
public class AdminServiceOrderAuditController {

    private final ServiceOrderAuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "List service-order audit logs with filters & pagination")
    public ResponseEntity<Page<ServiceOrderAuditLogDTO>> list(
            @RequestParam(required = false) List<String> eventTypes,
            @RequestParam(required = false) List<String> roles,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long appointmentId,
            @RequestParam(required = false) Long serviceOrderId,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        ServiceOrderAuditLogFilterDTO filter = ServiceOrderAuditLogFilterDTO.builder()
                .eventTypes(eventTypes)
                .roles(roles)
                .search(search)
                .from(from)
                .to(to)
                .appointmentId(appointmentId)
                .serviceOrderId(serviceOrderId)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        return ResponseEntity.ok(auditLogService.getAuditLogs(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get audit log detail")
    public ResponseEntity<ServiceOrderAuditLogDetailDTO> detail(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getDetail(id));
    }

    @GetMapping("/timeline/{appointmentId}")
    @Operation(summary = "Get chronological timeline of all audit events for an appointment")
    public ResponseEntity<List<ServiceOrderAuditLogDTO>> timeline(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(auditLogService.getTimeline(appointmentId));
    }

    @GetMapping("/event-types")
    @Operation(summary = "List distinct event types for filter dropdown")
    public ResponseEntity<List<String>> eventTypes() {
        return ResponseEntity.ok(auditLogService.getEventTypes());
    }
}
