package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.PrescriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Admin Prescription Controller
 * Base path: /api/admin/prescriptions
 *
 * APIs for admins to view and export prescriptions (read-only)
 * Admins CANNOT create, edit, or delete prescriptions (doctor privacy)
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/prescriptions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Prescription Management", description = "APIs for viewing and analyzing prescriptions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPrescriptionController {

    private final PrescriptionService prescriptionService;

    /**
     * List all prescriptions with advanced filters
     * GET /api/admin/prescriptions
     */
    @GetMapping
    @Operation(summary = "List all prescriptions", description = "Get paginated prescriptions list with filters (read-only)")
    public ResponseEntity<Page<PrescriptionDTO>> getAllPrescriptions(
            @Parameter(description = "Search by code, patient name, or doctor name")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId,

            @Parameter(description = "Filter by patient ID")
            @RequestParam(required = false) Long patientId,

            @Parameter(description = "Filter by status: ACTIVE or EXPIRED")
            @RequestParam(required = false) String status,

            @Parameter(description = "Filter from date (prescribed_date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "Filter to date (prescribed_date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") Integer pageNumber,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") Integer pageSize,

            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "prescriptionDate") String sortBy,

            @Parameter(description = "Sort direction: ASC or DESC")
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        log.info("Admin fetching prescriptions with filters - search: {}, doctorId: {}, patientId: {}, status: {}",
                search, doctorId, patientId, status);

        PrescriptionFilterDTO filter = PrescriptionFilterDTO.builder()
                .search(search)
                .doctorId(doctorId)
                .patientId(patientId)
                .status(status)
                .from(from)
                .to(to)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        Page<PrescriptionDTO> prescriptions = prescriptionService.getAllPrescriptionsForAdmin(filter);

        return ResponseEntity.ok(prescriptions);
    }

    /**
     * Get prescription statistics
     * GET /api/admin/prescriptions/statistics
     */
    @GetMapping("/statistics")
    @Operation(summary = "Get prescription statistics", description = "Get dashboard statistics for prescriptions")
    public ResponseEntity<PrescriptionStatsDTO> getPrescriptionStatistics(
            @Parameter(description = "From date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "To date (optional)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        log.info("Admin fetching prescription statistics - from: {}, to: {}", from, to);

        PrescriptionStatsDTO stats = prescriptionService.getPrescriptionStatistics(from, to);

        return ResponseEntity.ok(stats);
    }

    /**
     * Get prescription detail
     * GET /api/admin/prescriptions/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get prescription detail", description = "Get full prescription details (read-only, privacy respected)")
    public ResponseEntity<PrescriptionDetailDTO> getPrescriptionDetail(
            @Parameter(description = "Prescription ID")
            @PathVariable Long id
    ) {
        log.info("Admin fetching prescription detail - id: {}", id);

        PrescriptionDetailDTO detail = prescriptionService.getPrescriptionDetailForAdmin(id);

        return ResponseEntity.ok(detail);
    }

    /**
     * Export prescriptions to Excel or CSV
     * GET /api/admin/prescriptions/export
     */
    @GetMapping("/export")
    @Operation(summary = "Export prescriptions", description = "Export filtered prescriptions list to Excel or CSV")
    public ResponseEntity<Resource> exportPrescriptions(
            @Parameter(description = "Search by code, patient name, or doctor name")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId,

            @Parameter(description = "Filter by patient ID")
            @RequestParam(required = false) Long patientId,

            @Parameter(description = "Filter by status: ACTIVE or EXPIRED")
            @RequestParam(required = false) String status,

            @Parameter(description = "Filter from date (prescribed_date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "Filter to date (prescribed_date)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @Parameter(description = "Export format: EXCEL or CSV")
            @RequestParam(defaultValue = "EXCEL") String format
    ) {
        log.info("Admin exporting prescriptions - format: {}, filters applied", format);

        PrescriptionFilterDTO filter = PrescriptionFilterDTO.builder()
                .search(search)
                .doctorId(doctorId)
                .patientId(patientId)
                .status(status)
                .from(from)
                .to(to)
                .build();

        Resource resource = prescriptionService.exportPrescriptions(filter, format);

        String filename = "prescriptions_export." + (format.equalsIgnoreCase("CSV") ? "csv" : "xlsx");
        String contentType = format.equalsIgnoreCase("CSV")
                ? "text/csv"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    /**
     * Download prescription as PDF
     * GET /api/admin/prescriptions/{id}/pdf
     */
    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download prescription PDF", description = "Download prescription as PDF file")
    public ResponseEntity<Resource> downloadPrescriptionPdf(
            @Parameter(description = "Prescription ID")
            @PathVariable Long id
    ) {
        log.info("Admin downloading prescription PDF - id: {}", id);

        Resource resource = prescriptionService.generatePrescriptionPdf(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"prescription_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    /**
     * Print prescription (HTML or PDF)
     * GET /api/admin/prescriptions/{id}/print
     */
    @GetMapping("/{id}/print")
    @Operation(summary = "Print prescription", description = "Generate print-friendly prescription format (HTML or PDF)")
    public ResponseEntity<?> printPrescription(
            @Parameter(description = "Prescription ID")
            @PathVariable Long id,

            @Parameter(description = "Format: HTML or PDF (default: PDF)")
            @RequestParam(defaultValue = "PDF") String format
    ) {
        log.info("Admin printing prescription - id: {}, format: {}", id, format);

        PrintTemplateDTO template = prescriptionService.generatePrintTemplate(id, format);

        if ("HTML".equalsIgnoreCase(format)) {
            // Return HTML content with template DTO
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(template);
        } else {
            // Return PDF as file download info
            FileDownloadDTO fileInfo = FileDownloadDTO.builder()
                    .filename(template.getFilename())
                    .contentType("application/pdf")
                    .message("Prescription PDF generated successfully")
                    .build();

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(fileInfo);
        }
    }

    /**
     * Send prescription to patient email
     * POST /api/admin/prescriptions/{id}/send-email
     */
    @PostMapping("/{id}/send-email")
    @Operation(summary = "Send prescription email", description = "Send prescription to patient's email with options")
    public ResponseEntity<MessageDTO> sendPrescriptionEmail(
            @Parameter(description = "Prescription ID")
            @PathVariable Long id,

            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Email request with options",
                    required = true
            )
            @RequestBody SendPrescriptionEmailDTO emailRequest
    ) {
        log.info("Admin sending prescription email - id: {}, request: {}", id, emailRequest);

        prescriptionService.sendPrescriptionEmail(id, emailRequest);

        return ResponseEntity.ok(MessageDTO.success("Prescription sent to patient email successfully"));
    }
}
