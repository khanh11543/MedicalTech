package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import com.q2k.meditech.service.DataDeletionRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/gdpr/deletion-requests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - GDPR Data Deletion", description = "APIs for managing GDPR data deletion requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGdprDeletionController {

    private final DataDeletionRequestService deletionRequestService;

    // ==================== 1. LIST DELETION REQUESTS ====================
    @GetMapping
    @Operation(summary = "Get all deletion requests", description = "List deletion requests with filtering and pagination")
    public ResponseEntity<Page<DataDeletionRequestDTO>> getDeletionRequests(
            @Parameter(description = "Filter by status") @RequestParam(required = false) DeletionRequestStatus status,
            @Parameter(description = "Filter by user ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "Filter from date") @RequestParam(required = false) LocalDate from,
            @Parameter(description = "Filter to date") @RequestParam(required = false) LocalDate to,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") Integer size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        DeletionRequestFilterDTO filter = DeletionRequestFilterDTO.builder()
                .status(status)
                .userId(userId)
                .from(from)
                .to(to)
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        return ResponseEntity.ok(deletionRequestService.getDeletionRequests(filter));
    }

    // ==================== 2. GET REVIEW DETAIL ====================
    @GetMapping("/{id}/review")
    @Operation(summary = "Get deletion request review detail", description = "Get comprehensive review details including data counts")
    public ResponseEntity<DeletionReviewDetailDTO> getReviewDetail(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(deletionRequestService.getReviewDetail(id));
    }

    // ==================== 3. APPROVE DELETION REQUEST ====================
    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve deletion request", description = "Approve a data deletion request with optional scheduling")
    public ResponseEntity<DataDeletionRequestDTO> approveDeletionRequest(
            @PathVariable Long id,
            @Valid @RequestBody ApproveDeletionDTO dto
    ) {
        return ResponseEntity.ok(deletionRequestService.approveDeletionRequest(id, dto));
    }

    // ==================== 4. REJECT DELETION REQUEST ====================
    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject deletion request", description = "Reject a data deletion request with reason")
    public ResponseEntity<DataDeletionRequestDTO> rejectDeletionRequest(
            @PathVariable Long id,
            @Valid @RequestBody RejectDeletionDTO dto
    ) {
        return ResponseEntity.ok(deletionRequestService.rejectDeletionRequest(id, dto));
    }

    // ==================== 5. REQUEST MORE INFO ====================
    @PostMapping("/{id}/request-info")
    @Operation(summary = "Request more information", description = "Request additional information from the user")
    public ResponseEntity<DataDeletionRequestDTO> requestMoreInfo(
            @PathVariable Long id,
            @Valid @RequestBody RequestInfoDTO dto
    ) {
        return ResponseEntity.ok(deletionRequestService.requestMoreInfo(id, dto));
    }

    // ==================== 6. CANCEL DELETION REQUEST ====================
    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel deletion request", description = "Cancel a deletion request during grace period")
    public ResponseEntity<DataDeletionRequestDTO> cancelDeletionRequest(
            @PathVariable Long id,
            @Valid @RequestBody CancelDeletionDTO dto
    ) {
        return ResponseEntity.ok(deletionRequestService.cancelDeletionRequest(id, dto));
    }

    // ==================== 7. EXECUTE DELETION ====================
    @PostMapping("/{id}/execute")
    @Operation(summary = "Execute data deletion", description = "Immediately execute data deletion with admin password verification")
    public ResponseEntity<DeletionExecutionResultDTO> executeDeletion(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteDeletionDTO dto
    ) {
        return ResponseEntity.ok(deletionRequestService.executeDeletion(id, dto));
    }

    // ==================== 8. GET DELETION LOG ====================
    @GetMapping("/log")
    @Operation(summary = "Get deletion log", description = "Get audit log of all executed deletions")
    public ResponseEntity<Page<DeletionLogDTO>> getDeletionLog(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") Integer size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "executedDate") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDirection
    ) {
        return ResponseEntity.ok(deletionRequestService.getDeletionLog(page, size, sortBy, sortDirection));
    }
}
