package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.DataExportRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/gdpr/export-requests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - GDPR Data Export", description = "APIs for managing GDPR data export requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGdprExportController {

    private final DataExportRequestService exportRequestService;

    // ==================== LIST EXPORT REQUESTS ====================
    @GetMapping
    @Operation(summary = "List export requests", description = "Get paginated list of data export requests with filters")
    public ResponseEntity<Page<DataExportRequestDTO>> getExportRequests(
            @Parameter(description = "Filter by status: PENDING, PROCESSING, COMPLETED, FAILED")
            @RequestParam(required = false) String status,

            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) Long userId,

            @Parameter(description = "Filter from date (by requested_date)")
            @RequestParam(required = false) LocalDate from,

            @Parameter(description = "Filter to date (by requested_date)")
            @RequestParam(required = false) LocalDate to,

            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(defaultValue = "requestedDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        ExportRequestFilterDTO filter = ExportRequestFilterDTO.builder()
                .status(status)
                .userId(userId)
                .from(from)
                .to(to)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        Page<DataExportRequestDTO> result = exportRequestService.getExportRequests(filter);
        return ResponseEntity.ok(result);
    }

    // ==================== PROCESS EXPORT REQUEST ====================
    @PostMapping("/{id}/process")
    @Operation(summary = "Process export request", description = "Process a user data export request and generate the export file")
    public ResponseEntity<DataExportRequestDTO> processExportRequest(
            @PathVariable Long id,
            @RequestBody ProcessExportRequestDTO dto
    ) {
        DataExportRequestDTO result = exportRequestService.processExportRequest(id, dto);
        return ResponseEntity.ok(result);
    }

    // ==================== DOWNLOAD EXPORT FILE ====================
    @GetMapping("/{id}/download")
    @Operation(summary = "Download export file", description = "Download the generated export file")
    public ResponseEntity<Resource> downloadExportFile(@PathVariable Long id) {
        Resource resource = exportRequestService.downloadExportFile(id);
        String fileName = exportRequestService.getExportFileName(id);

        String contentType = "application/octet-stream";
        if (fileName.endsWith(".json")) {
            contentType = "application/json";
        } else if (fileName.endsWith(".csv")) {
            contentType = "text/csv";
        } else if (fileName.endsWith(".pdf") || fileName.endsWith(".txt")) {
            contentType = "application/pdf";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    // ==================== SEND EXPORT EMAIL ====================
    @PostMapping("/{id}/send-email")
    @Operation(summary = "Send export email", description = "Send the export file to user via email")
    public ResponseEntity<MessageDTO> sendExportEmail(
            @PathVariable Long id,
            @RequestBody SendExportEmailDTO dto
    ) {
        MessageDTO result = exportRequestService.sendExportEmail(id, dto);
        return ResponseEntity.ok(result);
    }

    // ==================== DELETE EXPORT REQUEST ====================
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete export request", description = "Delete export request and associated files")
    public ResponseEntity<MessageDTO> deleteExportRequest(@PathVariable Long id) {
        MessageDTO result = exportRequestService.deleteExportRequest(id);
        return ResponseEntity.ok(result);
    }

    // ==================== AUTO-PROCESS CONFIG ====================
    @PutMapping("/auto-process")
    @Operation(summary = "Toggle auto-process", description = "Enable/disable automatic export processing")
    public ResponseEntity<AutoProcessConfigDTO> toggleAutoProcess(
            @RequestBody AutoProcessConfigDTO dto
    ) {
        AutoProcessConfigDTO result = exportRequestService.toggleAutoProcess(dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/auto-process")
    @Operation(summary = "Get auto-process config", description = "Get current auto-process configuration")
    public ResponseEntity<AutoProcessConfigDTO> getAutoProcessConfig() {
        AutoProcessConfigDTO result = exportRequestService.getAutoProcessConfig();
        return ResponseEntity.ok(result);
    }
}
