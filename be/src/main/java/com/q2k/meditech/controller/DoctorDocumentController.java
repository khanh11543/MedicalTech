package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.DoctorDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Doctor Document Controller
 * Base path: /doctor/documents (context path /api is set in application.properties)
 * 
 * All endpoints require DOCTOR role (enforced by Security config)
 * Doctor ID is extracted from authenticated user's doctor profile
 */
@RestController
@RequestMapping("/doctor/documents")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Documents", description = "APIs for managing doctor verification documents")
public class DoctorDocumentController {

    private final DoctorDocumentService documentService;
    private final DoctorRepository doctorRepository;

    /**
     * POST /api/doctor/documents
     * Upload a new document for verification
     */
    @PostMapping
    @Operation(summary = "Upload document", description = "Upload a new document for verification")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<DoctorDocumentDTO> uploadDocument(
            @Valid @RequestBody DoctorDocumentCreateDTO dto) {

        Long doctorId = getCurrentDoctorId();
        log.info("POST /api/doctor/documents - doctorId: {}, type: {}", doctorId, dto.getDocType());

        DoctorDocumentDTO result = documentService.uploadDocument(doctorId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * GET /api/doctor/documents
     * List my documents with optional filters
     */
    @GetMapping
    @Operation(summary = "List my documents", description = "Get list of my uploaded documents")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<List<DoctorDocumentDTO>> listMyDocuments(
            @Parameter(description = "Filter by status (PENDING, APPROVED, REJECTED)")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Filter by document type (LICENSE, ID, DEGREE, EXPERIENCE, AFFILIATION_PROOF)")
            @RequestParam(required = false) String type) {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/documents - doctorId: {}, status: {}, type: {}", doctorId, status, type);

        List<DoctorDocumentDTO> documents = documentService.listMyDocuments(doctorId, status, type);

        return ResponseEntity.ok(documents);
    }

    /**
     * GET /api/doctor/documents/{id}
     * Get document detail
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get document detail", description = "Get detailed information of a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your document"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<DoctorDocumentDTO> getDocumentDetail(
            @Parameter(description = "Document ID") @PathVariable Long id) {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/documents/{} - doctorId: {}", id, doctorId);

        DoctorDocumentDTO document = documentService.getDocumentDetail(id);

        // Validate ownership
        if (!document.getDoctorId().equals(doctorId)) {
            throw new BadRequestException("You can only view your own documents");
        }

        return ResponseEntity.ok(document);
    }

    /**
     * DELETE /api/doctor/documents/{id}
     * Delete a pending document
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete document", description = "Delete a pending document (only PENDING status)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot delete non-pending document"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not your document"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<MessageDTO> deleteDocument(
            @Parameter(description = "Document ID") @PathVariable Long id) {

        Long doctorId = getCurrentDoctorId();
        log.info("DELETE /api/doctor/documents/{} - doctorId: {}", id, doctorId);

        documentService.deleteDocument(doctorId, id);

        return ResponseEntity.ok(MessageDTO.success("Document deleted successfully"));
    }

    /**
     * GET /api/doctor/documents/verification-summary
     * Get verification summary for the doctor
     */
    @GetMapping("/verification-summary")
    @Operation(summary = "Get verification summary", description = "Get summary of document verification status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not a doctor")
    })
    public ResponseEntity<DoctorDocumentService.DocumentVerificationSummary> getVerificationSummary() {

        Long doctorId = getCurrentDoctorId();
        log.info("GET /api/doctor/documents/verification-summary - doctorId: {}", doctorId);

        DoctorDocumentService.DocumentVerificationSummary summary = 
                documentService.getVerificationSummary(doctorId);

        return ResponseEntity.ok(summary);
    }

    // ========== HELPER METHODS ==========

    /**
     * Get current doctor ID from security context
     */
    private Long getCurrentDoctorId() {
        Long userId = com.q2k.meditech.util.SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new BadRequestException("User not authenticated");
        }

        // Find doctor by user ID
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user ID: " + userId));

        return doctor.getId();
    }
}