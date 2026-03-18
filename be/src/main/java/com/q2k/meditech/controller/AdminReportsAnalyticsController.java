package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ReportsAnalyticsDTO;
import com.q2k.meditech.service.ReportsAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

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

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * GET /api/admin/reports-analytics
     * Get comprehensive reports and analytics filtered by date range.
     * Both startDate and endDate must be provided together, or both omitted (defaults to this month).
     */
    @GetMapping
    @Operation(summary = "Get reports and analytics",
               description = "Get comprehensive business reports. Optionally pass startDate & endDate (yyyy-MM-dd) to filter by time range. Defaults to current month.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reports retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid date parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<?> getReportsAnalytics(
            @Parameter(description = "Start date (yyyy-MM-dd)") @RequestParam(required = false) String startDate,
            @Parameter(description = "End date (yyyy-MM-dd)") @RequestParam(required = false) String endDate) {

        log.info("GET /admin/reports-analytics?startDate={}&endDate={}", startDate, endDate);

        // Validate: both present or both absent
        boolean hasStart = startDate != null && !startDate.isBlank();
        boolean hasEnd = endDate != null && !endDate.isBlank();

        if (hasStart != hasEnd) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Both startDate and endDate must be provided together, or both omitted."));
        }

        LocalDate start;
        LocalDate end;

        if (hasStart) {
            // Parse dates
            try {
                start = LocalDate.parse(startDate, DATE_FMT);
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Invalid startDate format. Expected yyyy-MM-dd."));
            }
            try {
                end = LocalDate.parse(endDate, DATE_FMT);
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Invalid endDate format. Expected yyyy-MM-dd."));
            }

            // Validate range
            if (start.isAfter(end)) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "startDate must not be after endDate."));
            }
        } else {
            // Default: this month
            YearMonth thisMonth = YearMonth.now();
            start = thisMonth.atDay(1);
            end = LocalDate.now();
        }

        try {
            ReportsAnalyticsDTO analytics = reportsAnalyticsService.getReportsAnalytics(start, end);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            log.error("Error generating reports analytics", e);
            throw e;
        }
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
    public ResponseEntity<?> getDashboard(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return getReportsAnalytics(startDate, endDate);
    }
}
