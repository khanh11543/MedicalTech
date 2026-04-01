package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;

/**
 * Service interface for Refund operations
 */
public interface RefundService {

    /**
     * Get all refunds with filters
     */
    Page<RefundResponseDTO> getAllRefunds(
            String status,
            Long doctorId,
            Long patientId,
            String from,
            String to,
            String refundMethod,
            String refundReasonType,
            String searchTerm,
            Double minAmount,
            Double maxAmount,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortDir);

    /**
     * Get refund statistics
     */
    RefundStatsDTO getRefundStatistics(String from, String to);

    /**
     * Export refunds matching list filters (CSV, EXCEL/XLSX, PDF).
     */
    byte[] exportRefunds(
            String status,
            Long doctorId,
            Long patientId,
            String from,
            String to,
            String refundMethod,
            String refundReasonType,
            String searchTerm,
            Double minAmount,
            Double maxAmount,
            String sortBy,
            String sortDir,
            String format);

    /**
     * Get refund detail by ID
     */
    RefundDetailDTO getRefundDetail(Long refundId);

    /**
     * Process refund (mark as completed)
     */
    RefundResponseDTO processRefund(Long refundId, ProcessRefundDTO dto, Long currentUserId);

    /**
     * Approve a REQUESTED refund (REQUESTED → APPROVED)
     */
    RefundResponseDTO approveRefund(Long refundId, ApproveRefundDTO dto, Long currentUserId);

    /**
     * Reject refund request
     */
    RefundResponseDTO rejectRefund(Long refundId, RejectRefundDTO dto, Long currentUserId);

    /**
     * Retry a FAILED refund (FAILED → PROCESSING)
     */
    RefundResponseDTO retryRefund(Long refundId, RetryRefundDTO dto, Long currentUserId);

    /**
     * Mark a refund as FAILED (e.g., from scheduled job or gateway callback)
     */
    RefundResponseDTO markRefundFailed(Long refundId, String reason, Long currentUserId);

    /**
     * Create a new refund request
     */
    RefundResponseDTO createRefundRequest(Long paymentId, RefundDTO dto, Long currentUserId);
}
