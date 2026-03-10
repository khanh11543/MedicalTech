package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.ReviewDocDTO;
import com.q2k.meditech.service.DoctorDocumentService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Doctor Document Controller
 * Base path: /admin/doctor-documents (context path /api is set in application.properties)
 * 
 * All endpoints require ADMIN role (enforced by Security config)
 */
@RestController
@RequestMapping("/admin/doctor-documents")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Doctor Documents", description = "APIs for managing doctor verification documents (Admin only)")
public class AdminDoctorDocumentController {

    private final DoctorDocumentService documentService;

    /**
     * GET /api/admin/doctor-documents
     * List all doctor documents with filters and pagination
     */
    @GetMapping
    @Operation(summary = "List doctor documents", 
               description = "Get paginated list of doctor documents with optional filters")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<Page<DoctorDocumentDTO>> listDocuments(
            @Parameter(description = "Filter by status (PENDING, APPROVED, REJECTED)")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filter by document type")
            @RequestParam(required = false) String type,
            
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            
            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "asc") String sortOrder) {

        log.info("GET /admin/doctor-documents - status: {}, type: {}", status, type);

        Sort sort = sortOrder.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<DoctorDocumentDTO> documents = documentService.listAllDocuments(status, type, pageable);

        return ResponseEntity.ok(documents);
    }

    /**
     * GET /api/admin/doctor-documents/pending
     * List pending documents (shortcut for status=PENDING)
     */
    @GetMapping("/pending")
    @Operation(summary = "List pending documents", 
               description = "Get paginated list of pending documents awaiting review")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<Page<DoctorDocumentDTO>> listPendingDocuments(
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /admin/doctor-documents/pending");

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").ascending());

        Page<DoctorDocumentDTO> documents = documentService.listPendingDocuments(pageable);

        return ResponseEntity.ok(documents);
    }

    /**
     * GET /api/admin/doctor-documents/{id}
     * Get document detail
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get document detail", description = "Get detailed information of a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<DoctorDocumentDTO> getDocumentDetail(
            @Parameter(description = "Document ID") @PathVariable Long id) {

        log.info("GET /admin/doctor-documents/{}", id);

        DoctorDocumentDTO document = documentService.getDocumentDetail(id);

        return ResponseEntity.ok(document);
    }

    /**
     * PATCH /api/admin/doctor-documents/{id}/approve
     * Approve a document
     */
    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve document", description = "Approve a pending document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document approved successfully"),
            @ApiResponse(responseCode = "400", description = "Document is not pending"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<DoctorDocumentDTO> approveDocument(
            @Parameter(description = "Document ID") @PathVariable Long id,
            @Valid @RequestBody(required = false) ReviewDocDTO dto) {

        log.info("PATCH /admin/doctor-documents/{}/approve", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        DoctorDocumentDTO result = documentService.approveDocument(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/admin/doctor-documents/{id}/reject
     * Reject a document
     */
    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject document", description = "Reject a pending document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document rejected successfully"),
            @ApiResponse(responseCode = "400", description = "Document is not pending"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<DoctorDocumentDTO> rejectDocument(
            @Parameter(description = "Document ID") @PathVariable Long id,
            @Valid @RequestBody(required = false) ReviewDocDTO dto) {

        log.info("PATCH /admin/doctor-documents/{}/reject", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        DoctorDocumentDTO result = documentService.rejectDocument(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/doctor-documents/doctor/{doctorId}/summary
     * Get verification summary for a specific doctor
     */
    @GetMapping("/doctor/{doctorId}/summary")
    @Operation(summary = "Get doctor verification summary", 
               description = "Get document verification summary for a specific doctor")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    public ResponseEntity<DoctorDocumentService.DocumentVerificationSummary> getDoctorVerificationSummary(
            @Parameter(description = "Doctor ID") @PathVariable Long doctorId) {

        log.info("GET /admin/doctor-documents/doctor/{}/summary", doctorId);

        DoctorDocumentService.DocumentVerificationSummary summary = 
                documentService.getVerificationSummary(doctorId);

        return ResponseEntity.ok(summary);
    }
}