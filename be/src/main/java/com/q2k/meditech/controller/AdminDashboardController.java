package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AdminDashboardDTO;
import com.q2k.meditech.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin Dashboard Controller
 * Base path: /admin/dashboard (context path /api is set in application.properties)
 * 
 * All endpoints require ADMIN role (enforced by Security config)
 */
@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Dashboard", description = "APIs for admin dashboard statistics")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    /**
     * GET /api/admin/dashboard/statistics
     * Get dashboard statistics for admin panel
     */
    @GetMapping("/statistics")
    @Operation(summary = "Get dashboard statistics", 
               description = "Get comprehensive statistics for admin dashboard including users, doctors, appointments, etc.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<AdminDashboardDTO> getDashboardStatistics() {
        log.info("GET /admin/dashboard/statistics");
        
        AdminDashboardDTO statistics = dashboardService.getDashboardStatistics();
        
        return ResponseEntity.ok(statistics);
    }
}
