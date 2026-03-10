package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.PrescriptionTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/prescription-templates")
@RequiredArgsConstructor
@Tag(name = "Admin - Prescription Template Analytics", description = "APIs for prescription template statistics and analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPrescriptionTemplateController {

    private final PrescriptionTemplateService prescriptionTemplateService;

    @GetMapping("/statistics")
    @Operation(summary = "Template statistics overview", description = "Get overall template usage statistics")
    public ResponseEntity<TemplateStatsDTO> getTemplateStatistics(
            @Parameter(description = "From date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "To date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        // Admin fetching template statistics

        TemplateStatsDTO stats = prescriptionTemplateService.getTemplateStatistics(from, to);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/by-doctor")
    @Operation(summary = "Templates by doctor", description = "Get template usage breakdown by doctor")
    public ResponseEntity<List<DoctorTemplateStatsDTO>> getTemplatesByDoctor(
            @Parameter(description = "From date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "To date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Number of top doctors to return")
            @RequestParam(defaultValue = "10") int top
    ) {
        // Admin fetching templates by doctor

        List<DoctorTemplateStatsDTO> stats = prescriptionTemplateService.getTemplatesByDoctor(from, to, top);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/medications/common")
    @Operation(summary = "Common medications", description = "Get most commonly prescribed medications")
    public ResponseEntity<List<CommonMedicationDTO>> getCommonMedications(
            @Parameter(description = "From date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "To date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Number of top medications to return")
            @RequestParam(defaultValue = "20") int top,

            @Parameter(description = "Group by: MEDICATION, GENERIC, or CATEGORY")
            @RequestParam(defaultValue = "MEDICATION") String groupBy
    ) {
        // Admin fetching common medications

        List<CommonMedicationDTO> medications = prescriptionTemplateService.getCommonMedications(from, to, top, groupBy);

        return ResponseEntity.ok(medications);
    }

    @GetMapping("/usage-trends")
    @Operation(summary = "Template usage trends", description = "Get template usage trends over time")
    public ResponseEntity<TemplateUsageTrendsDTO> getUsageTrends(
            @Parameter(description = "From date (required)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "To date (required)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Group by: DAY, WEEK, or MONTH")
            @RequestParam(defaultValue = "WEEK") String groupBy,

            @Parameter(description = "Doctor ID filter (optional)")
            @RequestParam(required = false) Long doctorId
    ) {
        // Admin fetching usage trends

        TemplateUsageTrendsDTO trends = prescriptionTemplateService.getUsageTrends(from, to, groupBy, doctorId);

        return ResponseEntity.ok(trends);
    }
}
