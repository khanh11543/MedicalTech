package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.InvoiceDeliveryService;
import com.q2k.meditech.service.InvoiceService;
import com.q2k.meditech.service.PaymentService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receptionist Payment Controller
 * Base path: /api/receptionist/payments
 * 
 * APIs for receptionists/cashiers to manage payments
 * All endpoints require RECEPTIONIST or ADMIN role
 */
@RestController
@RequestMapping("/receptionist/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Receptionist - Payments", description = "APIs for receptionists to manage payments")
public class ReceptionistPaymentController {

    private final PaymentService paymentService;
    private final InvoiceService invoiceService;
    private final InvoiceDeliveryService invoiceDeliveryService;

    /**
     * POST /api/receptionist/payments
     * Create payment request for an appointment
     */
    @PostMapping
    @Operation(
        summary = "Create payment request",
        description = "Create a payment request for an appointment. Sets up payment details."
    )
    public ResponseEntity<PaymentDTO> createPayment(
            @Valid @RequestBody PaymentCreateDTO dto) {

        log.info("POST /receptionist/payments - appointmentId: {}, method: {}", 
                dto.getAppointmentId(), dto.getPaymentMethod());

        Long currentUserId = SecurityUtil.getCurrentUserId();
        PaymentDTO result = paymentService.createPayment(dto, currentUserId);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * POST /api/receptionist/payments/{id}/momo/init
     * Initialize MoMo payment (create order, get QR/pay URL)
     */
    @PostMapping(value = "/{id}/momo/init", consumes = {"application/json", "text/plain", "*/*"})
    @Operation(
        summary = "Initialize MoMo payment",
        description = "Initialize MoMo payment gateway, get QR code and payment URL"
    )
    public ResponseEntity<PaymentInitDTO> initMomoPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @RequestBody(required = false) MomoInitDTO dto) {

        log.info("POST /receptionist/payments/{}/momo/init", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (dto == null) {
            dto = new MomoInitDTO();
        }

        PaymentInitDTO result = paymentService.initMomoPayment(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/receptionist/payments/{id}/qr
     * Get QR code for payment (MoMo only)
     */
    @GetMapping("/{id}/qr")
    @Operation(
        summary = "Get payment QR code",
        description = "Get QR code to display for customer payment (MoMo only)"
    )
    public ResponseEntity<PaymentQrDTO> getPaymentQr(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /receptionist/payments/{}/qr", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentQrDTO result = paymentService.getPaymentQr(id, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/receptionist/payments/{id}/qr/refresh
     * Refresh QR code if expired
     */
    @PostMapping("/{id}/qr/refresh")
    @Operation(
        summary = "Refresh QR code",
        description = "Re-generate QR code if the previous one has expired"
    )
    public ResponseEntity<PaymentInitDTO> refreshQr(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("POST /receptionist/payments/{}/qr/refresh", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        PaymentInitDTO result = paymentService.refreshQr(id, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/receptionist/payments/{id}/mark-cash
     * Mark payment as paid with cash
     */
    @PatchMapping(value = "/{id}/mark-cash", consumes = {"application/json", "text/plain", "*/*"})
    @Operation(
        summary = "Mark as paid (cash)",
        description = "Confirm that cash payment has been received"
    )
    public ResponseEntity<PaymentDTO> markPaidCash(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @RequestBody(required = false) @Valid MarkCashDTO dto) {

        log.info("PATCH /receptionist/payments/{}/mark-cash", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (dto == null) {
            dto = new MarkCashDTO();
        }

        PaymentDTO result = paymentService.markPaidCash(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/receptionist/payments/{id}/cancel
     * Cancel payment request
     */
    @PatchMapping(value = "/{id}/cancel", consumes = {"application/json", "text/plain", "*/*"})
    @Operation(
        summary = "Cancel payment",
        description = "Cancel a pending payment request"
    )
    public ResponseEntity<PaymentDTO> cancelPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @RequestBody(required = false) @Valid CancelPaymentDTO dto) {

        log.info("PATCH /receptionist/payments/{}/cancel", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (dto == null) {
            dto = new CancelPaymentDTO();
        }

        PaymentDTO result = paymentService.cancelPayment(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/receptionist/payments/{id}
     * Get payment details
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get payment details",
        description = "Get detailed information about a payment"
    )
    public ResponseEntity<PaymentDTO> getPayment(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /receptionist/payments/{}", id);

        PaymentDTO result = paymentService.getPaymentById(id);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/receptionist/invoices/by-payment/{paymentId}
     * Get invoice by payment ID (for printing)
     */
    @GetMapping("/invoices/by-payment/{paymentId}")
    @Operation(
        summary = "Get invoice by payment",
        description = "Get invoice for a payment (for printing receipt)"
    )
    public ResponseEntity<InvoiceDTO> getInvoiceByPayment(
            @Parameter(description = "Payment ID") @PathVariable Long paymentId) {

        log.info("GET /receptionist/invoices/by-payment/{}", paymentId);

        InvoiceDTO invoice = invoiceService.getInvoiceByPaymentId(paymentId);

        return ResponseEntity.ok(invoice);
    }

    /**
     * GET /api/receptionist/invoices/{invoiceId}/pdf
     * Download invoice as PDF (for printing)
     */
    @GetMapping("/invoices/{invoiceId}/pdf")
    @Operation(
        summary = "Download invoice PDF",
        description = "Download invoice as PDF file for printing"
    )
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @Parameter(description = "Invoice ID") @PathVariable Long invoiceId) {

        log.info("GET /receptionist/invoices/{}/pdf", invoiceId);

        byte[] pdfBytes = invoiceDeliveryService.generateInvoicePdf(invoiceId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + invoiceId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}