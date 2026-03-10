package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.RefundService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Refund Controller
 * Base path: /api/admin/refunds
 * 
 * APIs for admins to manage refund requests
 * Lifecycle: REQUESTED → APPROVED → PROCESSING → COMPLETED / FAILED
 * 
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Refund Management", description = "APIs for managing refund requests")
public class AdminRefundController {

    private final RefundService refundService;

    /**
     * GET /api/admin/refunds
     * List all refunds with filters
     */
    @GetMapping
    @Operation(
        summary = "List all refunds",
        description = "Get paginated list of refunds with filters (status, doctorId, patientId, date range, method, reason, search, amount range)"
    )
    public ResponseEntity<Page<RefundResponseDTO>> listAllRefunds(
            @Parameter(description = "Filter by status (REQUESTED/APPROVED/PENDING/PROCESSING/COMPLETED/FAILED/REJECTED)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by doctor ID")
            @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Filter by patient ID")
            @RequestParam(required = false) Long patientId,
            @Parameter(description = "From date (yyyy-MM-dd)")
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)")
            @RequestParam(required = false) String to,
            @Parameter(description = "Filter by refund method (CASH/MOMO/BANK_TRANSFER/VNPAY/ZALOPAY/CARD/ORIGINAL_METHOD)")
            @RequestParam(required = false) String refundMethod,
            @Parameter(description = "Filter by refund reason type")
            @RequestParam(required = false) String refundReasonType,
            @Parameter(description = "Search by patient name, refund code, or payment code")
            @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Minimum refund amount")
            @RequestParam(required = false) Double minAmount,
            @Parameter(description = "Maximum refund amount")
            @RequestParam(required = false) Double maxAmount,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field (default: requestedDate)")
            @RequestParam(defaultValue = "requestedDate") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/refunds - status: {}, doctorId: {}, patientId: {}, method: {}, reason: {}",
                status, doctorId, patientId, refundMethod, refundReasonType);

        Page<RefundResponseDTO> refunds = refundService.getAllRefunds(
                status, doctorId, patientId, from, to,
                refundMethod, refundReasonType, searchTerm, minAmount, maxAmount,
                pageNumber, pageSize, sortBy, sortDir);

        return ResponseEntity.ok(refunds);
    }

    /**
     * GET /api/admin/refunds/statistics
     * Get refund statistics
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get refund statistics",
        description = "Get statistics including total refunds, requested/approved/pending/completed counts, refund rate, etc."
    )
    public ResponseEntity<RefundStatsDTO> getRefundStatistics(
            @Parameter(description = "From date (yyyy-MM-dd)")
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)")
            @RequestParam(required = false) String to) {

        log.info("GET /admin/refunds/statistics - from: {}, to: {}", from, to);

        RefundStatsDTO stats = refundService.getRefundStatistics(from, to);

        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/admin/refunds/{id}
     * Get refund detail
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get refund detail",
        description = "Get full refund details including payment, patient, doctor, appointment info and history timeline"
    )
    public ResponseEntity<RefundDetailDTO> getRefundDetail(
            @Parameter(description = "Refund ID") @PathVariable Long id) {

        log.info("GET /admin/refunds/{}", id);

        RefundDetailDTO detail = refundService.getRefundDetail(id);

        return ResponseEntity.ok(detail);
    }

    /**
     * POST /api/admin/refunds
     * Create refund request (admin initiated)
     */
    @PostMapping
    @Operation(
        summary = "Create refund request",
        description = "Admin creates a new refund request for a payment. Status starts as REQUESTED."
    )
    public ResponseEntity<RefundResponseDTO> createRefundRequest(
            @Parameter(description = "Payment ID to refund")
            @RequestParam Long paymentId,
            @Valid @RequestBody RefundDTO dto) {

        log.info("POST /admin/refunds - paymentId: {}", paymentId);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        RefundResponseDTO refund = refundService.createRefundRequest(paymentId, dto, currentUserId);

        return ResponseEntity.status(201).body(refund);
    }

    /**
     * PATCH /api/admin/refunds/{id}/approve
     * Approve a REQUESTED refund (REQUESTED → APPROVED)
     */
    @PatchMapping("/{id}/approve")
    @Operation(
        summary = "Approve refund",
        description = "Approve a REQUESTED refund. Segregation of duties: approver cannot be the requester."
    )
    public ResponseEntity<RefundResponseDTO> approveRefund(
            @Parameter(description = "Refund ID") @PathVariable Long id,
            @Valid @RequestBody ApproveRefundDTO dto) {

        log.info("PATCH /admin/refunds/{}/approve", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        RefundResponseDTO refund = refundService.approveRefund(id, dto, currentUserId);

        return ResponseEntity.ok(refund);
    }

    /**
     * PATCH /api/admin/refunds/{id}/process
     * Process/complete refund (APPROVED → COMPLETED)
     */
    @PatchMapping("/{id}/process")
    @Operation(
        summary = "Process refund",
        description = "Mark an APPROVED refund as processed/completed. For manual cash refunds, requires transaction reference and cashier confirmation."
    )
    public ResponseEntity<RefundResponseDTO> processRefund(
            @Parameter(description = "Refund ID") @PathVariable Long id,
            @Valid @RequestBody ProcessRefundDTO dto) {

        log.info("PATCH /admin/refunds/{}/process", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        RefundResponseDTO refund = refundService.processRefund(id, dto, currentUserId);

        return ResponseEntity.ok(refund);
    }

    /**
     * PATCH /api/admin/refunds/{id}/reject
     * Reject refund request (REQUESTED/APPROVED → REJECTED)
     */
    @PatchMapping("/{id}/reject")
    @Operation(
        summary = "Reject refund",
        description = "Reject a refund request with a reason. Can reject from REQUESTED or APPROVED status."
    )
    public ResponseEntity<RefundResponseDTO> rejectRefund(
            @Parameter(description = "Refund ID") @PathVariable Long id,
            @Valid @RequestBody RejectRefundDTO dto) {

        log.info("PATCH /admin/refunds/{}/reject", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        RefundResponseDTO refund = refundService.rejectRefund(id, dto, currentUserId);

        return ResponseEntity.ok(refund);
    }

    /**
     * PATCH /api/admin/refunds/{id}/retry
     * Retry a FAILED refund (FAILED → PROCESSING)
     */
    @PatchMapping("/{id}/retry")
    @Operation(
        summary = "Retry failed refund",
        description = "Retry a FAILED refund. Optionally switch refund method/type. Limited by max retry count."
    )
    public ResponseEntity<RefundResponseDTO> retryRefund(
            @Parameter(description = "Refund ID") @PathVariable Long id,
            @Valid @RequestBody RetryRefundDTO dto) {

        log.info("PATCH /admin/refunds/{}/retry", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        RefundResponseDTO refund = refundService.retryRefund(id, dto, currentUserId);

        return ResponseEntity.ok(refund);
    }
}
