package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.InvoiceService;
import com.q2k.meditech.service.PaymentService;
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
 * Admin Payment Controller
 * Base path: /api/admin/payments
 * 
 * APIs for admins to manage payments, refunds, and invoices
 * All endpoints require ADMIN role
 * 
 * TODO: Add @PreAuthorize("hasRole('ADMIN')") when security is enabled
 */
@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Payment Management", description = "APIs for managing payments and refunds")
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;

    /**
     * GET /api/admin/payments
     * List all payments with filters
     */
    @GetMapping
    @Operation(
        summary = "List all payments",
        description = "Admin view and filter all payments in the system"
    )
    public ResponseEntity<Page<PaymentDTO>> listAllPayments(
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by payment method") @RequestParam(required = false) String method,
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Filter by patient ID") @RequestParam(required = false) Long patientId,
            @Parameter(description = "Filter by appointment ID") @RequestParam(required = false) Long appointmentId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int pageSize) {

        log.info("GET /admin/payments - status: {}, method: {}, patientId: {}, appointmentId: {}", 
                status, method, patientId, appointmentId);

        Page<PaymentDTO> payments = paymentService.getAllPayments(
                status, method, from, to, patientId, appointmentId, pageNumber, pageSize);

        return ResponseEntity.ok(payments);
    }

    /**
     * GET /api/admin/payments/{id}
     * Get payment detail
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get payment detail",
        description = "View detailed information about any payment"
    )
    public ResponseEntity<PaymentDTO> getPaymentDetail(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /admin/payments/{}", id);

        PaymentDTO payment = paymentService.getPaymentById(id);

        return ResponseEntity.ok(payment);
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

        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L; // Placeholder

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

        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L; // Placeholder

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

        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L; // Placeholder

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

        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L; // Placeholder

        PaymentDTO payment = paymentService.reconcileMomoStatus(id, currentUserId);

        return ResponseEntity.ok(payment);
    }
}