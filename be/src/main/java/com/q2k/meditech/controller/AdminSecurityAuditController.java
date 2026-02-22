package com.q2k.meditech.controller;

import com.q2k.meditech.dto.SecurityAuditDashboardDTO;
import com.q2k.meditech.dto.SecurityAuditLogDTO;
import com.q2k.meditech.dto.SecurityEventDTO;
import com.q2k.meditech.service.SecurityAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Security & Audit Controller
 * Base path: /admin/security-audit
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/security-audit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Security & Audit", description = "APIs for security monitoring and audit log management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityAuditController {

    private final SecurityAuditService securityAuditService;

    /**
     * GET /api/admin/security-audit/dashboard
     * Get security and audit dashboard statistics
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get security audit dashboard", 
               description = "Get comprehensive security and audit statistics including security events, audit logs, and user activities")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dashboard retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<SecurityAuditDashboardDTO> getDashboard() {
        log.info("GET /admin/security-audit/dashboard");
        SecurityAuditDashboardDTO dashboard = securityAuditService.getDashboardStatistics();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/admin/security-audit/events
     * Get all security events
     */
    @GetMapping("/events")
    @Operation(summary = "Get all security events", 
               description = "Get list of all security events including failed logins, lockouts, password changes, etc.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Security events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<SecurityEventDTO>> getAllSecurityEvents() {
        log.info("GET /admin/security-audit/events");
        List<SecurityEventDTO> events = securityAuditService.getAllSecurityEvents();
        return ResponseEntity.ok(events);
    }

    /**
     * GET /api/admin/security-audit/events/user/{userId}
     * Get security events by user ID
     */
    @GetMapping("/events/user/{userId}")
    @Operation(summary = "Get security events by user", 
               description = "Get all security events for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Security events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<SecurityEventDTO>> getSecurityEventsByUserId(@PathVariable Long userId) {
        log.info("GET /admin/security-audit/events/user/{}", userId);
        List<SecurityEventDTO> events = securityAuditService.getSecurityEventsByUserId(userId);
        return ResponseEntity.ok(events);
    }

    /**
     * GET /api/admin/security-audit/audit-logs
     * Get all audit logs
     */
    @GetMapping("/audit-logs")
    @Operation(summary = "Get all audit logs", 
               description = "Get list of all audit logs tracking system changes and user activities")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Audit logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<SecurityAuditLogDTO>> getAllAuditLogs() {
        log.info("GET /admin/security-audit/audit-logs");
        List<SecurityAuditLogDTO> logs = securityAuditService.getAllAuditLogs();
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/admin/security-audit/audit-logs/user/{userId}
     * Get audit logs by user ID
     */
    @GetMapping("/audit-logs/user/{userId}")
    @Operation(summary = "Get audit logs by user", 
               description = "Get all audit logs for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Audit logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<SecurityAuditLogDTO>> getAuditLogsByUserId(@PathVariable Long userId) {
        log.info("GET /admin/security-audit/audit-logs/user/{}", userId);
        List<SecurityAuditLogDTO> logs = securityAuditService.getAuditLogsByUserId(userId);
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/admin/security-audit/audit-logs/entity
     * Get audit logs by entity type and ID
     */
    @GetMapping("/audit-logs/entity")
    @Operation(summary = "Get audit logs by entity", 
               description = "Get all audit logs for a specific entity (e.g., Appointment, Payment)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Audit logs retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<SecurityAuditLogDTO>> getAuditLogsByEntity(
            @RequestParam String entityType,
            @RequestParam Long entityId) {
        log.info("GET /admin/security-audit/audit-logs/entity?entityType={}&entityId={}", entityType, entityId);
        List<SecurityAuditLogDTO> logs = securityAuditService.getAuditLogsByEntity(entityType, entityId);
        return ResponseEntity.ok(logs);
    }
}
