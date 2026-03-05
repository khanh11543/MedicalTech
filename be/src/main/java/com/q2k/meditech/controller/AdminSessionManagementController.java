package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.SessionStatus;
import com.q2k.meditech.service.SessionManagementService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/security/sessions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Session Management", description = "APIs for managing user sessions and login attempts (10.5)")
public class AdminSessionManagementController {

    private final SessionManagementService sessionManagementService;

    // ===== Sessions =====

    @GetMapping
    @Operation(summary = "List sessions", description = "Get paginated list of user sessions with filters")
    public ResponseEntity<Page<UserSessionDTO>> getSessions(
            @Parameter(description = "Search by user/IP") @RequestParam(required = false) String search,
            @Parameter(description = "Session status") @RequestParam(required = false) SessionStatus status,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by IP address") @RequestParam(required = false) String ipAddress,
            @Parameter(description = "Filter by device type") @RequestParam(required = false) String deviceType,
            @Parameter(description = "Filter by browser") @RequestParam(required = false) String browserName,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "lastSeenAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/sessions - search: {}, status: {}", search, status);
        SessionFilterDTO filter = SessionFilterDTO.builder()
                .search(search)
                .status(status)
                .userId(userId)
                .ipAddress(ipAddress)
                .deviceType(deviceType)
                .browserName(browserName)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(sessionManagementService.getSessions(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session detail", description = "Get a single session by ID")
    public ResponseEntity<UserSessionDTO> getSessionById(
            @Parameter(description = "Session ID") @PathVariable Long id) {
        log.info("GET /admin/security/sessions/{}", id);
        return ResponseEntity.ok(sessionManagementService.getSessionById(id));
    }

    @PostMapping("/force-logout")
    @Operation(summary = "Force logout", description = "Force logout sessions by session IDs, user ID, or IP address")
    public ResponseEntity<MessageDTO> forceLogout(@Valid @RequestBody ForceLogoutDTO dto) {
        log.info("POST /admin/security/sessions/force-logout");
        Long currentUserId = SecurityUtil.getCurrentUserId();
        int count = sessionManagementService.forceLogout(dto, currentUserId);
        return ResponseEntity.ok(MessageDTO.success(count + " session(s) revoked successfully"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get session statistics", description = "Get aggregate statistics for active sessions")
    public ResponseEntity<SessionStatsDTO> getSessionStats() {
        log.info("GET /admin/security/sessions/stats");
        return ResponseEntity.ok(sessionManagementService.getSessionStats());
    }

    // ===== Login Attempts =====

    @GetMapping("/login-attempts")
    @Operation(summary = "List login attempts", description = "Get paginated list of login attempts for a user")
    public ResponseEntity<Page<LoginAttemptDTO>> getLoginAttempts(
            @Parameter(description = "User ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        log.info("GET /admin/security/sessions/login-attempts - userId: {}", userId);
        return ResponseEntity.ok(sessionManagementService.getLoginAttempts(userId, page, size));
    }

    @GetMapping("/login-attempts/stats")
    @Operation(summary = "Get login attempt statistics", description = "Get statistics for login attempts in a period")
    public ResponseEntity<LoginAttemptStatsDTO> getLoginAttemptStats(
            @Parameter(description = "Period: 24h, 7d, 30d, 90d") @RequestParam(defaultValue = "24h") String period) {
        log.info("GET /admin/security/sessions/login-attempts/stats - period: {}", period);
        return ResponseEntity.ok(sessionManagementService.getLoginAttemptStats(period));
    }
}
