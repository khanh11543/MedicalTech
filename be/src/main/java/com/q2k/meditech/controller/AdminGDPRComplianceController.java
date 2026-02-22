package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DataProcessingActivityDTO;
import com.q2k.meditech.dto.DataRequestDTO;
import com.q2k.meditech.dto.GDPRComplianceDashboardDTO;
import com.q2k.meditech.dto.UserConsentDTO;
import com.q2k.meditech.service.GDPRComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin GDPR Compliance Controller
 * Base path: /admin/gdpr-compliance
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/gdpr-compliance")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - GDPR Compliance", description = "APIs for GDPR compliance and data privacy management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGDPRComplianceController {

    private final GDPRComplianceService gdprComplianceService;

    /**
     * GET /api/admin/gdpr-compliance/dashboard
     * Get GDPR compliance dashboard statistics
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get GDPR compliance dashboard", 
               description = "Get comprehensive GDPR compliance statistics including data requests, consents, and processing activities")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dashboard retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<GDPRComplianceDashboardDTO> getDashboard() {
        log.info("GET /admin/gdpr-compliance/dashboard");
        GDPRComplianceDashboardDTO dashboard = gdprComplianceService.getDashboardStatistics();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/admin/gdpr-compliance/data-requests
     * Get all data requests
     */
    @GetMapping("/data-requests")
    @Operation(summary = "Get all data requests", 
               description = "Get list of all GDPR data requests (export, deletion, rectification)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Data requests retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<DataRequestDTO>> getAllDataRequests() {
        log.info("GET /admin/gdpr-compliance/data-requests");
        List<DataRequestDTO> requests = gdprComplianceService.getAllDataRequests();
        return ResponseEntity.ok(requests);
    }

    /**
     * GET /api/admin/gdpr-compliance/data-requests/{id}
     * Get data request by ID
     */
    @GetMapping("/data-requests/{id}")
    @Operation(summary = "Get data request by ID", 
               description = "Get detailed information about a specific data request")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Data request retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Data request not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<DataRequestDTO> getDataRequestById(@PathVariable Long id) {
        log.info("GET /admin/gdpr-compliance/data-requests/{}", id);
        DataRequestDTO request = gdprComplianceService.getDataRequestById(id);
        return ResponseEntity.ok(request);
    }

    /**
     * PUT /api/admin/gdpr-compliance/data-requests/{id}/status
     * Update data request status
     */
    @PutMapping("/data-requests/{id}/status")
    @Operation(summary = "Update data request status", 
               description = "Update the status of a data request (PENDING, IN_PROGRESS, COMPLETED, REJECTED)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Data request not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<DataRequestDTO> updateDataRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        log.info("PUT /admin/gdpr-compliance/data-requests/{}/status", id);
        
        String status = (String) request.get("status");
        String adminNotes = (String) request.get("adminNotes");
        Long processedById = request.get("processedById") != null ? 
                ((Number) request.get("processedById")).longValue() : null;

        DataRequestDTO updated = gdprComplianceService.updateDataRequestStatus(
                id, status, adminNotes, processedById);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/admin/gdpr-compliance/consents
     * Get all user consents
     */
    @GetMapping("/consents")
    @Operation(summary = "Get all user consents", 
               description = "Get list of all user consent records")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Consents retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<UserConsentDTO>> getAllUserConsents() {
        log.info("GET /admin/gdpr-compliance/consents");
        List<UserConsentDTO> consents = gdprComplianceService.getAllUserConsents();
        return ResponseEntity.ok(consents);
    }

    /**
     * GET /api/admin/gdpr-compliance/consents/user/{userId}
     * Get user consents by user ID
     */
    @GetMapping("/consents/user/{userId}")
    @Operation(summary = "Get consents by user", 
               description = "Get all consent records for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Consents retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<UserConsentDTO>> getUserConsentsByUserId(@PathVariable Long userId) {
        log.info("GET /admin/gdpr-compliance/consents/user/{}", userId);
        List<UserConsentDTO> consents = gdprComplianceService.getUserConsentsByUserId(userId);
        return ResponseEntity.ok(consents);
    }

    /**
     * GET /api/admin/gdpr-compliance/processing-activities
     * Get all data processing activities
     */
    @GetMapping("/processing-activities")
    @Operation(summary = "Get all processing activities", 
               description = "Get list of all data processing activities (GDPR Article 30)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Processing activities retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<DataProcessingActivityDTO>> getAllProcessingActivities() {
        log.info("GET /admin/gdpr-compliance/processing-activities");
        List<DataProcessingActivityDTO> activities = gdprComplianceService.getAllProcessingActivities();
        return ResponseEntity.ok(activities);
    }

    /**
     * GET /api/admin/gdpr-compliance/processing-activities/active
     * Get active data processing activities
     */
    @GetMapping("/processing-activities/active")
    @Operation(summary = "Get active processing activities", 
               description = "Get list of currently active data processing activities")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Processing activities retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<List<DataProcessingActivityDTO>> getActiveProcessingActivities() {
        log.info("GET /admin/gdpr-compliance/processing-activities/active");
        List<DataProcessingActivityDTO> activities = gdprComplianceService.getActiveProcessingActivities();
        return ResponseEntity.ok(activities);
    }

    /**
     * POST /api/admin/gdpr-compliance/processing-activities
     * Create new data processing activity
     */
    @PostMapping("/processing-activities")
    @Operation(summary = "Create processing activity", 
               description = "Create a new data processing activity record")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Processing activity created successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<DataProcessingActivityDTO> createProcessingActivity(
            @RequestBody DataProcessingActivityDTO dto) {
        log.info("POST /admin/gdpr-compliance/processing-activities");
        DataProcessingActivityDTO created = gdprComplianceService.createProcessingActivity(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/admin/gdpr-compliance/processing-activities/{id}
     * Update data processing activity
     */
    @PutMapping("/processing-activities/{id}")
    @Operation(summary = "Update processing activity", 
               description = "Update an existing data processing activity record")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Processing activity updated successfully"),
            @ApiResponse(responseCode = "404", description = "Processing activity not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<DataProcessingActivityDTO> updateProcessingActivity(
            @PathVariable Long id,
            @RequestBody DataProcessingActivityDTO dto) {
        log.info("PUT /admin/gdpr-compliance/processing-activities/{}", id);
        DataProcessingActivityDTO updated = gdprComplianceService.updateProcessingActivity(id, dto);
        return ResponseEntity.ok(updated);
    }
}
