package com.q2k.meditech.controller;

import com.q2k.meditech.dto.receptionist.DashboardPreferencesDTO;
import com.q2k.meditech.dto.receptionist.PendingActionsDTO;
import com.q2k.meditech.dto.receptionist.ReceptionistDashboardStatsDTO;
import com.q2k.meditech.service.ReceptionistDashboardService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller for Receptionist Dashboard operations.
 * Endpoints: A (stats), F (pending-actions), J (preferences).
 */
@Slf4j
@RestController
@RequestMapping("/receptionist/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Dashboard", description = "Dashboard APIs for receptionist role")
public class ReceptionistDashboardController {

    private final ReceptionistDashboardService dashboardService;

    // ==================== A. DASHBOARD STATS ====================

    /**
     * GET /api/receptionist/dashboard/stats
     * Aggregated statistics: appointments, check-in, queue, payments.
     */
    @GetMapping("/stats")
    @Operation(
        summary = "Get dashboard statistics",
        description = "Aggregated stats: appointment counts, check-in status, queue summary, and payment overview"
    )
    public ResponseEntity<ReceptionistDashboardStatsDTO> getDashboardStats(
            @Parameter(description = "Date for stats (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date) {

        log.info("GET /receptionist/dashboard/stats - date: {}", date);
        LocalDate targetDate = date != null ? LocalDate.parse(date) : null;
        ReceptionistDashboardStatsDTO stats = dashboardService.getDashboardStats(targetDate);
        return ResponseEntity.ok(stats);
    }

    // ==================== F. PENDING ACTIONS ====================

    /**
     * GET /api/receptionist/dashboard/pending-actions
     * Summary of tasks needing receptionist attention.
     */
    @GetMapping("/pending-actions")
    @Operation(
        summary = "Get pending actions",
        description = "Counts of items needing attention: confirmations, check-ins, overdue, pending payments, no-show candidates"
    )
    public ResponseEntity<PendingActionsDTO> getPendingActions() {
        log.info("GET /receptionist/dashboard/pending-actions");
        PendingActionsDTO actions = dashboardService.getPendingActions();
        return ResponseEntity.ok(actions);
    }

    // ==================== J. PREFERENCES ====================

    /**
     * GET /api/receptionist/dashboard/preferences
     * Get current user's dashboard preferences.
     */
    @GetMapping("/preferences")
    @Operation(
        summary = "Get dashboard preferences",
        description = "Retrieve receptionist's dashboard layout and display preferences"
    )
    public ResponseEntity<DashboardPreferencesDTO> getPreferences() {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("GET /receptionist/dashboard/preferences - userId: {}", userId);
        DashboardPreferencesDTO prefs = dashboardService.getPreferences(userId);
        return ResponseEntity.ok(prefs);
    }

    /**
     * PUT /api/receptionist/dashboard/preferences
     * Update current user's dashboard preferences.
     */
    @PutMapping("/preferences")
    @Operation(
        summary = "Update dashboard preferences",
        description = "Save receptionist's dashboard layout and display preferences"
    )
    public ResponseEntity<DashboardPreferencesDTO> updatePreferences(
            @Valid @RequestBody DashboardPreferencesDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        log.info("PUT /receptionist/dashboard/preferences - userId: {}", userId);
        DashboardPreferencesDTO result = dashboardService.updatePreferences(userId, dto);
        return ResponseEntity.ok(result);
    }
}
