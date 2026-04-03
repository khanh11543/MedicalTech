package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.InvoiceService;
import com.q2k.meditech.service.PaymentService;
import com.q2k.meditech.util.SecurityUtil;
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

import java.math.BigDecimal;

/**
 * Admin Payment Controller
 * Base path: /api/admin/payments
 * 
 * APIs for admins and receptionists to manage payments, refunds, and invoices
 * All endpoints require ADMIN or RECEPTIONIST role
 */
@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Payment Management", description = "APIs for managing payments and refunds")
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;

    /**
     * GET /api/admin/payments
     * List all payments with advanced filters
     */
    @GetMapping
    @Operation(
        summary = "List all payments",
        description = "Admin view and filter all payments in the system with advanced search capabilities"
    )
    public ResponseEntity<Page<PaymentDTO>> listAllPayments(
            @Parameter(description = "Search by transaction code, patient name, or appointment code") 
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by status (PENDING/COMPLETED/FAILED/REFUNDED/CANCELLED)") 
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by payment method (CASH/CARD/BANK_TRANSFER/MOMO/ZALOPAY/VNPAY/INSURANCE)") 
            @RequestParam(required = false, name = "paymentMethod") String method,
            @Parameter(description = "Filter by doctor ID") 
            @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Filter by patient ID") 
            @RequestParam(required = false) Long patientId,
            @Parameter(description = "Minimum amount filter") 
            @RequestParam(required = false) BigDecimal minAmount,
            @Parameter(description = "Maximum amount filter") 
            @RequestParam(required = false) BigDecimal maxAmount,
            @Parameter(description = "From date (yyyy-MM-dd)") 
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") 
            @RequestParam(required = false) String to,
            @Parameter(description = "Page number (0-based)") 
            @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") 
            @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "Sort field (default: paymentDate)") 
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)") 
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /admin/payments - search: {}, status: {}, method: {}, doctorId: {}, patientId: {}", 
                search, status, method, doctorId, patientId);

        Page<PaymentDTO> payments = paymentService.getAllPaymentsAdvanced(
                search, status, method, doctorId, patientId, 
                minAmount, maxAmount, from, to, 
                pageNumber, pageSize, sortBy, sortDir);

        return ResponseEntity.ok(payments);
    }

    /**
     * GET /api/admin/payments/statistics
     * Get payment statistics for dashboard
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get payment statistics",
        description = "Get dashboard statistics including today's revenue, monthly revenue, payment method distribution, pending payments, and refund statistics"
    )
    public ResponseEntity<PaymentStatsDTO> getPaymentStatistics(
            @Parameter(description = "From date (yyyy-MM-dd)") 
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") 
            @RequestParam(required = false) String to) {

        log.info("GET /admin/payments/statistics - from: {}, to: {}", from, to);

        PaymentStatsDTO stats = paymentService.getPaymentStatistics(from, to);

        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/admin/payments/bulk/mark-paid
     * Bulk mark multiple pending payments as paid
     */
    @PostMapping("/bulk/mark-paid")
    @Operation(
        summary = "Bulk mark as paid",
        description = "Mark multiple pending payments as paid at once"
    )
    public ResponseEntity<PaymentBulkResultDTO> bulkMarkAsPaid(
            @Valid @RequestBody BulkMarkPaidDTO dto) {

        log.info("POST /admin/payments/bulk/mark-paid - paymentIds: {}", dto.getPaymentIds().size());

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentBulkResultDTO result = paymentService.bulkMarkAsPaid(dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/payments/export
     * Export filtered transactions to file
     */
    @GetMapping("/export")
    @Operation(
        summary = "Export transactions",
        description = "Export filtered transactions to Excel, CSV, or PDF format"
    )
    public ResponseEntity<byte[]> exportTransactions(
            @Parameter(description = "Search filter") 
            @RequestParam(required = false) String search,
            @Parameter(description = "Status filter") 
            @RequestParam(required = false) String status,
            @Parameter(description = "Payment method filter") 
            @RequestParam(required = false, name = "paymentMethod") String method,
            @Parameter(description = "Doctor ID filter") 
            @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Patient ID filter") 
            @RequestParam(required = false) Long patientId,
            @Parameter(description = "Minimum amount filter") 
            @RequestParam(required = false) BigDecimal minAmount,
            @Parameter(description = "Maximum amount filter") 
            @RequestParam(required = false) BigDecimal maxAmount,
            @Parameter(description = "From date (yyyy-MM-dd)") 
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") 
            @RequestParam(required = false) String to,
            @Parameter(description = "Export format (EXCEL/CSV/PDF)") 
            @RequestParam(defaultValue = "EXCEL") String format) {

        log.info("GET /admin/payments/export - format: {}", format);

        byte[] fileContent = paymentService.exportPayments(
                search, status, method, doctorId, patientId,
                minAmount, maxAmount, from, to, format);

        // Determine content type and filename
        String contentType;
        String filename;

        switch (format.toUpperCase()) {
            case "CSV":
                contentType = "text/csv; charset=UTF-8";
                filename = "payments_export.csv";
                break;
            case "PDF":
                contentType = "application/pdf";
                filename = "payments_export.pdf";
                break;
            default:
                // XSSFWorkbook produces OOXML (.xlsx), not BIFF (.xls)
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                filename = "payments_export.xlsx";
                break;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileContent);
    }

    /**
     * GET /api/admin/payments/{id}
     * Get comprehensive payment detail
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get payment detail",
        description = "View comprehensive information about any payment including patient, doctor, appointment, gateway, and invoice details"
    )
    public ResponseEntity<PaymentDetailDTO> getPaymentDetail(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /admin/payments/{}", id);

        PaymentDetailDTO payment = paymentService.getPaymentDetail(id);

        return ResponseEntity.ok(payment);
    }

    /**
     * POST /api/admin/payments/{id}/mark-paid
     * Manually mark payment as paid
     */
    @PostMapping("/{id}/mark-paid")
    @Operation(
        summary = "Mark payment as paid",
        description = "Manually mark a pending or initiated payment as paid (for cash, bank transfer, etc.)"
    )
    public ResponseEntity<PaymentDTO> markPaymentAsPaid(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody MarkPaidDTO dto) {

        log.info("POST /admin/payments/{}/mark-paid - method: {}", id, dto.getPaymentMethod());

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentDTO payment = paymentService.markAsPaid(id, dto, currentUserId);

        return ResponseEntity.ok(payment);
    }

    /**
     * POST /api/admin/payments/{id}/retry
     * Retry payment - resend payment link
     */
    @PostMapping("/{id}/retry")
    @Operation(
        summary = "Retry payment",
        description = "Resend payment link to patient via email or SMS for pending/failed payments"
    )
    public ResponseEntity<MessageDTO> retryPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody RetryPaymentDTO dto) {

        log.info("POST /admin/payments/{}/retry - sendVia: {}", id, dto.getSendVia());

        Long currentUserId = SecurityUtil.getCurrentUserId();

        MessageDTO result = paymentService.retryPayment(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/payments/{id}/send-receipt
     * Send payment receipt to patient
     */
    @PostMapping("/{id}/send-receipt")
    @Operation(
        summary = "Send payment receipt",
        description = "Send payment receipt to patient via email for paid/refunded payments"
    )
    public ResponseEntity<MessageDTO> sendReceipt(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody SendReceiptDTO dto) {

        log.info("POST /admin/payments/{}/send-receipt - email: {}", id, dto.getEmail());

        Long currentUserId = SecurityUtil.getCurrentUserId();

        MessageDTO result = paymentService.sendReceipt(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/payments/{id}/receipt
     * Download payment receipt as PDF
     */
    @GetMapping("/{id}/receipt")
    @Operation(
        summary = "Download receipt",
        description = "Download payment receipt as a text/PDF file"
    )
    public ResponseEntity<byte[]> downloadReceipt(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /admin/payments/{}/receipt", id);

        byte[] receipt = paymentService.downloadReceipt(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"receipt_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(receipt);
    }

    /**
     * GET /api/admin/payments/{id}/history
     * Get payment history/timeline
     */
    @GetMapping("/{id}/history")
    @Operation(
        summary = "Get payment history",
        description = "Get payment timeline showing all status changes and actions"
    )
    public ResponseEntity<PaymentHistoryDTO> getPaymentHistory(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /admin/payments/{}/history", id);

        PaymentHistoryDTO history = paymentService.getPaymentHistory(id);

        return ResponseEntity.ok(history);
    }

    /**
     * POST /api/admin/payments/{id}/refund
     * Refund payment (cash or MoMo)
     */
    @PostMapping("/{id}/refund")
    @Operation(
        summary = "Refund payment",
        description = "Process refund for cash or MoMo payment"
    )
    public ResponseEntity<PaymentDTO> refundPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody RefundDTO dto) {

        log.info("POST /admin/payments/{}/refund - amount: {}", id, dto.getRefundAmount());

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentDTO payment = paymentService.refundPayment(id, dto, currentUserId);

        return ResponseEntity.ok(payment);
    }

    /**
     * PATCH /api/admin/payments/{id}/cancel
     * Cancel payment (admin override)
     */
    @PatchMapping("/{id}/cancel")
    @Operation(
        summary = "Cancel payment",
        description = "Admin can cancel any payment that is not yet PAID"
    )
    public ResponseEntity<PaymentDTO> cancelPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody CancelPaymentDTO dto) {

        log.info("PATCH /admin/payments/{}/cancel", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentDTO payment = paymentService.adminCancelPayment(id, dto, currentUserId);

        return ResponseEntity.ok(payment);
    }

    /**
     * GET /api/admin/invoices/by-payment/{paymentId}
     * Get invoice by payment ID
     */
    @GetMapping("/invoices/by-payment/{paymentId}")
    @Operation(
        summary = "Get invoice by payment",
        description = "Admin retrieve invoice for any payment"
    )
    public ResponseEntity<InvoiceDTO> getInvoiceByPayment(
            @Parameter(description = "Payment ID") @PathVariable Long paymentId) {

        log.info("GET /admin/invoices/by-payment/{}", paymentId);

        InvoiceDTO invoice = invoiceService.getInvoiceByPaymentId(paymentId);

        return ResponseEntity.ok(invoice);
    }

    /**
     * PATCH /api/admin/invoices/{invoiceId}
     * Update invoice information
     */
    @PatchMapping("/invoices/{invoiceId}")
    @Operation(
        summary = "Update invoice info",
        description = "Update invoice notes, due date, or status"
    )
    public ResponseEntity<InvoiceDTO> updateInvoice(
            @Parameter(description = "Invoice ID") @PathVariable Long invoiceId,
            @Valid @RequestBody InvoiceUpdateDTO dto) {

        log.info("PATCH /admin/invoices/{}", invoiceId);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        InvoiceDTO invoice = invoiceService.updateInvoice(invoiceId, dto, currentUserId);

        return ResponseEntity.ok(invoice);
    }

    /**
     * POST /api/admin/payments/expire
     * Run job to expire pending/initiated payments
     */
    @PostMapping("/expire")
    @Operation(
        summary = "Expire pending payments",
        description = "Scheduled job to expire old pending/initiated payments and QR codes"
    )
    public ResponseEntity<ExpirePaymentsResultDTO> expirePayments(
            @RequestBody(required = false) ExpirePaymentsDTO dto) {

        log.info("POST /admin/payments/expire");

        // Default parameters if not provided
        if (dto == null) {
            dto = ExpirePaymentsDTO.builder()
                    .expiryMinutes(15)
                    .dryRun(false)
                    .build();
        }

        ExpirePaymentsResultDTO result = paymentService.expirePayments(dto);

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/payments/{id}/reconcile/momo
     * Reconcile MoMo payment status
     */
    @PostMapping("/{id}/reconcile/momo")
    @Operation(
        summary = "Reconcile MoMo status",
        description = "Query MoMo API to get current payment status and update local record"
    )
    public ResponseEntity<PaymentDTO> reconcileMomoStatus(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("POST /admin/payments/{}/reconcile/momo", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentDTO payment = paymentService.reconcileMomoStatus(id, currentUserId);

        return ResponseEntity.ok(payment);
    }
}