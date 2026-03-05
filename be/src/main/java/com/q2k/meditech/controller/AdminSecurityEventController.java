package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.service.SecurityEventService;
import com.q2k.meditech.util.SecurityUtil;
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
@RequestMapping("/admin/security/events")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Security Events", description = "APIs for managing security events (10.1)")
public class AdminSecurityEventController {

    private final SecurityEventService securityEventService;

    @GetMapping
    @Operation(summary = "List security events", description = "Get paginated list of security events with filters")
    public ResponseEntity<Page<SecurityEventDTO>> getSecurityEvents(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Event types filter") @RequestParam(required = false) List<SecurityEventType> eventTypes,
            @Parameter(description = "Severity filter") @RequestParam(required = false) List<SecuritySeverity> severities,
            @Parameter(description = "Status filter") @RequestParam(required = false) SecurityEventStatus status,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by IP address") @RequestParam(required = false) String ipAddress,
            @Parameter(description = "Filter by country") @RequestParam(required = false) String geoCountry,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/events - search: {}, status: {}", search, status);
        SecurityEventFilterDTO filter = SecurityEventFilterDTO.builder()
                .search(search)
                .eventTypes(eventTypes)
                .severities(severities)
                .status(status)
                .userId(userId)
                .ipAddress(ipAddress)
                .geoCountry(geoCountry)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(securityEventService.getSecurityEvents(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get security event detail", description = "Get a single security event by ID")
    public ResponseEntity<SecurityEventDTO> getSecurityEventById(
            @Parameter(description = "Event ID") @PathVariable Long id) {
        log.info("GET /admin/security/events/{}", id);
        return ResponseEntity.ok(securityEventService.getSecurityEventById(id));
    }

    @PatchMapping("/{id}/review")
    @Operation(summary = "Mark event as reviewed", description = "Mark a security event as reviewed by the current admin")
    public ResponseEntity<SecurityEventDTO> reviewEvent(
            @Parameter(description = "Event ID") @PathVariable Long id) {
        log.info("PATCH /admin/security/events/{}/review", id);
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(securityEventService.reviewSecurityEvent(id, currentUserId));
    }

    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Resolve security event", description = "Mark a security event as resolved with a resolution note")
    public ResponseEntity<SecurityEventDTO> resolveEvent(
            @Parameter(description = "Event ID") @PathVariable Long id,
            @Parameter(description = "Resolution note") @RequestParam String resolutionNote) {
        log.info("PATCH /admin/security/events/{}/resolve", id);
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(securityEventService.resolveSecurityEvent(id, currentUserId, resolutionNote));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get security event statistics", description = "Get statistics for security events in a period")
    public ResponseEntity<SecurityEventStatsDTO> getStats(
            @Parameter(description = "Period: 24h, 7d, 30d, 90d") @RequestParam(defaultValue = "24h") String period) {
        log.info("GET /admin/security/events/stats - period: {}", period);
        return ResponseEntity.ok(securityEventService.getSecurityEventStats(period));
    }
}
