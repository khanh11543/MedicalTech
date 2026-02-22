package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReportsAnalyticsDTO;
import com.q2k.meditech.service.ReportsAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Reports & Analytics Controller
 * Base path: /admin/reports-analytics
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/reports-analytics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Reports & Analytics", description = "APIs for business reports and analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportsAnalyticsController {

    private final ReportsAnalyticsService reportsAnalyticsService;

    /**
     * GET /api/admin/reports-analytics
     * Get comprehensive reports and analytics
     */
    @GetMapping
    @Operation(summary = "Get reports and analytics", 
               description = "Get comprehensive business reports including user analytics, appointment trends, revenue statistics, doctor performance, and specialty insights")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reports retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<ReportsAnalyticsDTO> getReportsAnalytics() {
        log.info("GET /admin/reports-analytics");
        ReportsAnalyticsDTO analytics = reportsAnalyticsService.getReportsAnalytics();
        return ResponseEntity.ok(analytics);
    }

    /**
     * GET /api/admin/reports-analytics/dashboard
     * Alias for main analytics endpoint
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get analytics dashboard", 
               description = "Alias endpoint for comprehensive reports and analytics dashboard")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dashboard retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<ReportsAnalyticsDTO> getDashboard() {
        log.info("GET /admin/reports-analytics/dashboard");
        ReportsAnalyticsDTO analytics = reportsAnalyticsService.getReportsAnalytics();
        return ResponseEntity.ok(analytics);
    }
}
