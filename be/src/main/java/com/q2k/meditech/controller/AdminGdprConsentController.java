package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import com.q2k.meditech.service.ConsentManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/gdpr/consents")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - GDPR Consent Management", description = "APIs for managing user consent records")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGdprConsentController {

    private final ConsentManagementService consentManagementService;

    // ==================== 1. GET CONSENT STATISTICS ====================
    @GetMapping("/statistics")
    @Operation(summary = "Get consent statistics", description = "Get dashboard statistics for consent management")
    public ResponseEntity<ConsentStatsDTO> getConsentStatistics(
            @Parameter(description = "From date") @RequestParam(required = false) LocalDate from,
            @Parameter(description = "To date") @RequestParam(required = false) LocalDate to
    ) {
        return ResponseEntity.ok(consentManagementService.getConsentStatistics(from, to));
    }

    // ==================== 2. LIST CONSENT RECORDS ====================
    @GetMapping
    @Operation(summary = "List consent records", description = "Get paginated list of user consent records")
    public ResponseEntity<Page<UserConsentDTO>> getConsentRecords(
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by consent type") @RequestParam(required = false) ConsentType consentType,
            @Parameter(description = "Filter by status") @RequestParam(required = false) ConsentStatus status,
            @Parameter(description = "From date") @RequestParam(required = false) LocalDate from,
            @Parameter(description = "To date") @RequestParam(required = false) LocalDate to,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") Integer pageSize,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "consentDate") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        ConsentFilterDTO filter = ConsentFilterDTO.builder()
                .userId(userId)
                .consentType(consentType)
                .status(status)
                .from(from)
                .to(to)
                .page(pageNumber)
                .size(pageSize)
                .sortBy(sortBy)
                .sortDirection(sortDir)
                .build();

        return ResponseEntity.ok(consentManagementService.getConsentRecords(filter));
    }

    // ==================== 3. GET USER CONSENT DETAIL ====================
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user consent detail", description = "Get comprehensive consent history for a specific user")
    public ResponseEntity<UserConsentDetailDTO> getUserConsentDetail(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(consentManagementService.getUserConsentDetail(userId));
    }

    // ==================== 4. REVOKE CONSENT ====================
    @PostMapping("/{id}/revoke")
    @Operation(summary = "Revoke consent", description = "Revoke consent on user's behalf")
    public ResponseEntity<UserConsentDTO> revokeConsent(
            @PathVariable Long id,
            @Valid @RequestBody RevokeConsentDTO dto
    ) {
        return ResponseEntity.ok(consentManagementService.revokeConsent(id, dto));
    }

    // ==================== 5. EXPORT CONSENT RECORDS ====================
    @GetMapping("/export")
    @Operation(summary = "Export consent records", description = "Export all consent records for compliance")
    public ResponseEntity<byte[]> exportConsentRecords(
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter by consent type") @RequestParam(required = false) String consentType,
            @Parameter(description = "From date") @RequestParam(required = false) LocalDate from,
            @Parameter(description = "To date") @RequestParam(required = false) LocalDate to,
            @Parameter(description = "Export format: CSV or EXCEL") @RequestParam(defaultValue = "CSV") String format
    ) {
        byte[] fileBytes = consentManagementService.exportConsentRecords(userId, consentType, from, to, format);
        String fileName = consentManagementService.getExportFileName(format);

        String contentType = "EXCEL".equalsIgnoreCase(format)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileBytes);
    }

    // ==================== 6. GET CONSENT TRENDS ====================
    @GetMapping("/trends")
    @Operation(summary = "Get consent trends", description = "Get consent trends over time for analytics")
    public ResponseEntity<ConsentTrendsDTO> getConsentTrends(
            @Parameter(description = "From date (required)") @RequestParam LocalDate from,
            @Parameter(description = "To date (required)") @RequestParam LocalDate to,
            @Parameter(description = "Group by: DAY, WEEK, MONTH") @RequestParam(defaultValue = "MONTH") String groupBy,
            @Parameter(description = "Filter by consent type") @RequestParam(required = false) String consentType
    ) {
        return ResponseEntity.ok(consentManagementService.getConsentTrends(from, to, groupBy, consentType));
    }
}
