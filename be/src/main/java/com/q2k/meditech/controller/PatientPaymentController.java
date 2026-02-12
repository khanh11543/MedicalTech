package com.q2k.meditech.controller;

import com.q2k.meditech.dto.InvoiceDTO;
import com.q2k.meditech.dto.PaymentDTO;
import com.q2k.meditech.dto.PaymentQrDTO;
import com.q2k.meditech.service.InvoiceDeliveryService;
import com.q2k.meditech.service.InvoiceService;
import com.q2k.meditech.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Patient Payment Controller
 * Base path: /api/patient
 * 
 * APIs for patients to view their payments and invoices
 * All endpoints require PATIENT role
 * 
 * TODO: Add @PreAuthorize("hasRole('PATIENT')") when security is enabled
 */
@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient - Payments & Invoices", description = "APIs for patients to manage payments and invoices")
public class PatientPaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;
    private final InvoiceDeliveryService invoiceDeliveryService;

    /**
     * GET /api/patient/payments
     * List my payments with pagination and filters
     */
    @GetMapping("/payments")
    @Operation(
        summary = "List my payments",
        description = "Get paginated list of my payment history with filters"
    )
    public ResponseEntity<Page<PaymentDTO>> listMyPayments(
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by payment method") @RequestParam(required = false) String method,
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /patient/payments - status: {}, method: {}, from: {}, to: {}", 
                status, method, from, to);

        // TODO: Get current patient ID from SecurityContext
        // Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // Long patientId = getCurrentPatientId(auth);
        Long patientId = 1L; // Placeholder - replace with actual patient ID from auth

        Page<PaymentDTO> payments = paymentService.getMyPayments(
                patientId, status, method, from, to, pageNumber, pageSize);

        return ResponseEntity.ok(payments);
    }

    /**
     * GET /api/patient/payments/{id}
     * Get payment detail (with ownership check)
     */
    @GetMapping("/payments/{id}")
    @Operation(
        summary = "Get payment detail",
        description = "Get detailed information about a payment (ownership verified)"
    )
    public ResponseEntity<PaymentDTO> getPaymentDetail(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /patient/payments/{}", id);

        // TODO: Get current patient ID from SecurityContext
        Long patientId = 1L; // Placeholder

        PaymentDTO payment = paymentService.getPaymentByIdForPatient(id, patientId);

        return ResponseEntity.ok(payment);
    }

    /**
     * GET /api/patient/payments/{id}/qr
     * Get QR code to pay (for MOMO payments)
     */
    @GetMapping("/payments/{id}/qr")
    @Operation(
        summary = "Get payment QR code",
        description = "Get QR code to complete payment (MoMo only, ownership verified)"
    )
    public ResponseEntity<PaymentQrDTO> getPaymentQr(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /patient/payments/{}/qr", id);

        // TODO: Get current patient ID from SecurityContext
        Long patientId = 1L; // Placeholder

        PaymentQrDTO qr = paymentService.getPaymentQrForPatient(id, patientId);

        return ResponseEntity.ok(qr);
    }

    /**
     * GET /api/patient/invoices/by-payment/{paymentId}
     * Get invoice by payment ID
     */
    @GetMapping("/invoices/by-payment/{paymentId}")
    @Operation(
        summary = "Get invoice by payment",
        description = "Get invoice for a specific payment (ownership verified)"
    )
    public ResponseEntity<InvoiceDTO> getInvoiceByPayment(
            @Parameter(description = "Payment ID") @PathVariable Long paymentId) {

        log.info("GET /patient/invoices/by-payment/{}", paymentId);

        // TODO: Get current patient ID from SecurityContext
        Long patientId = 1L; // Placeholder

        InvoiceDTO invoice = invoiceService.getInvoiceByPaymentIdForPatient(paymentId, patientId);

        return ResponseEntity.ok(invoice);
    }

    /**
     * GET /api/patient/invoices/{invoiceId}/pdf
     * Download invoice as PDF
     */
    @GetMapping("/invoices/{invoiceId}/pdf")
    @Operation(
        summary = "Download invoice PDF",
        description = "Download invoice as PDF file (ownership verified)"
    )
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @Parameter(description = "Invoice ID") @PathVariable Long invoiceId) {

        log.info("GET /patient/invoices/{}/pdf", invoiceId);

        // TODO: Get current patient ID from SecurityContext
        // First verify ownership
        Long patientId = 1L; // Placeholder
        invoiceService.getInvoiceByIdForPatient(invoiceId, patientId);

        // Then generate PDF
        byte[] pdfBytes = invoiceDeliveryService.generateInvoicePdf(invoiceId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + invoiceId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}