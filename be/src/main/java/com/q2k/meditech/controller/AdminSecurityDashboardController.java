package com.q2k.meditech.controller;

import com.q2k.meditech.dto.security.SecurityDashboardDTO;
import com.q2k.meditech.service.SecurityDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/security/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Security Dashboard", description = "Aggregated security overview dashboard")
public class AdminSecurityDashboardController {

    private final SecurityDashboardService securityDashboardService;

    @GetMapping
    @Operation(summary = "Get security dashboard", description = "Get aggregated security stats from all sub-modules")
    public ResponseEntity<SecurityDashboardDTO> getDashboard(
            @Parameter(description = "Period: 24h, 7d, 30d, 90d") @RequestParam(defaultValue = "24h") String period) {
        log.info("GET /admin/security/dashboard - period: {}", period);
        return ResponseEntity.ok(securityDashboardService.getSecurityDashboard(period));
    }
}
