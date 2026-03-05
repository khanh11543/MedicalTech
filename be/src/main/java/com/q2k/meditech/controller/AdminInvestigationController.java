package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.service.InvestigationService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/security/investigations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Investigation Tools", description = "APIs for managing security investigations (10.6)")
public class AdminInvestigationController {

    private final InvestigationService investigationService;

    // ===== CRUD =====

    @GetMapping
    @Operation(summary = "List investigations", description = "Get paginated list of investigations with filters")
    public ResponseEntity<Page<InvestigationSummaryDTO>> getInvestigations(
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Status filter") @RequestParam(required = false) List<InvestigationStatus> statuses,
            @Parameter(description = "Type filter") @RequestParam(required = false) List<InvestigationType> types,
            @Parameter(description = "Severity filter") @RequestParam(required = false) List<SecuritySeverity> severities,
            @Parameter(description = "Assigned to user ID") @RequestParam(required = false) Long assignedToId,
            @Parameter(description = "Created by user ID") @RequestParam(required = false) Long createdById,
            @Parameter(description = "Overdue only") @RequestParam(required = false) Boolean overdue,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/investigations - search: {}", search);
        InvestigationFilterDTO filter = InvestigationFilterDTO.builder()
                .search(search)
                .statuses(statuses)
                .types(types)
                .severities(severities)
                .assignedToId(assignedToId)
                .createdById(createdById)
                .overdue(overdue)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(investigationService.getInvestigations(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get investigation detail", description = "Get full investigation detail with notes, evidence, and related data")
    public ResponseEntity<InvestigationDTO> getInvestigationById(
            @Parameter(description = "Investigation ID") @PathVariable Long id) {
        log.info("GET /admin/security/investigations/{}", id);
        return ResponseEntity.ok(investigationService.getInvestigationById(id));
    }

    @PostMapping
    @Operation(summary = "Create investigation", description = "Create a new security investigation")
    public ResponseEntity<InvestigationDTO> createInvestigation(
            @Valid @RequestBody CreateInvestigationDTO dto) {
        log.info("POST /admin/security/investigations - title: {}", dto.getTitle());
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(investigationService.createInvestigation(dto, currentUserId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update investigation", description = "Update an existing investigation")
    public ResponseEntity<InvestigationDTO> updateInvestigation(
            @Parameter(description = "Investigation ID") @PathVariable Long id,
            @Valid @RequestBody UpdateInvestigationDTO dto) {
        log.info("PUT /admin/security/investigations/{}", id);
        return ResponseEntity.ok(investigationService.updateInvestigation(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete investigation", description = "Delete an investigation")
    public ResponseEntity<MessageDTO> deleteInvestigation(
            @Parameter(description = "Investigation ID") @PathVariable Long id) {
        log.info("DELETE /admin/security/investigations/{}", id);
        investigationService.deleteInvestigation(id);
        return ResponseEntity.ok(MessageDTO.success("Investigation deleted successfully"));
    }

    // ===== Notes =====

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add note", description = "Add a note to an investigation")
    public ResponseEntity<InvestigationNoteDTO> addNote(
            @Parameter(description = "Investigation ID") @PathVariable Long id,
            @Valid @RequestBody AddInvestigationNoteDTO dto) {
        log.info("POST /admin/security/investigations/{}/notes", id);
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(investigationService.addNote(id, dto, currentUserId));
    }

    @GetMapping("/{id}/notes")
    @Operation(summary = "Get notes", description = "Get all notes for an investigation")
    public ResponseEntity<List<InvestigationNoteDTO>> getNotes(
            @Parameter(description = "Investigation ID") @PathVariable Long id) {
        log.info("GET /admin/security/investigations/{}/notes", id);
        return ResponseEntity.ok(investigationService.getNotes(id));
    }

    // ===== Evidence =====

    @PostMapping("/{id}/evidence")
    @Operation(summary = "Add evidence", description = "Add evidence to an investigation")
    public ResponseEntity<InvestigationEvidenceDTO> addEvidence(
            @Parameter(description = "Investigation ID") @PathVariable Long id,
            @Valid @RequestBody AddInvestigationEvidenceDTO dto) {
        log.info("POST /admin/security/investigations/{}/evidence", id);
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(investigationService.addEvidence(id, dto, currentUserId));
    }

    @GetMapping("/{id}/evidence")
    @Operation(summary = "Get evidence", description = "Get all evidence for an investigation")
    public ResponseEntity<List<InvestigationEvidenceDTO>> getEvidence(
            @Parameter(description = "Investigation ID") @PathVariable Long id) {
        log.info("GET /admin/security/investigations/{}/evidence", id);
        return ResponseEntity.ok(investigationService.getEvidence(id));
    }

    // ===== Timeline =====

    @GetMapping("/{id}/timeline")
    @Operation(summary = "Get timeline", description = "Get chronological timeline of all investigation activities")
    public ResponseEntity<List<InvestigationTimelineDTO>> getTimeline(
            @Parameter(description = "Investigation ID") @PathVariable Long id) {
        log.info("GET /admin/security/investigations/{}/timeline", id);
        return ResponseEntity.ok(investigationService.getTimeline(id));
    }

    // ===== Statistics =====

    @GetMapping("/stats")
    @Operation(summary = "Get investigation statistics", description = "Get aggregate statistics for investigations")
    public ResponseEntity<InvestigationStatsDTO> getStats() {
        log.info("GET /admin/security/investigations/stats");
        return ResponseEntity.ok(investigationService.getInvestigationStats());
    }
}
