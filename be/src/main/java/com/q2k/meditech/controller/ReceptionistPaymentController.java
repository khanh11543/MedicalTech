package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.EndOfDayReportDTO;
import com.q2k.meditech.dto.receptionist.HourlyRevenueDTO;
import com.q2k.meditech.dto.receptionist.PendingPaymentDTO;
import com.q2k.meditech.dto.receptionist.SendPaymentLinkDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@PreAuthorize("hasRole('RECEPTIONIST')")
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
     * POST /api/receptionist/payments/prescription
     * Create payment request for a prescription
     */
    @PostMapping("/prescription")
    @Operation(
        summary = "Create prescription payment",
        description = "Create a payment request for prescription medications."
    )
    public ResponseEntity<PaymentDTO> createPrescriptionPayment(
            @Valid @RequestBody PrescriptionPaymentCreateDTO dto) {

        log.info("POST /receptionist/payments/prescription - prescriptionId: {}, method: {}",
                dto.getPrescriptionId(), dto.getPaymentMethod());

        Long currentUserId = SecurityUtil.getCurrentUserId();
        PaymentDTO result = paymentService.createPrescriptionPayment(dto, currentUserId);

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

    // ==================== PAYMENT LIST ====================

    /**
     * GET /api/receptionist/payments
     * List all payments with filters (for Payment History tab)
     */
    @GetMapping
    @Operation(
        summary = "List payments",
        description = "List and filter payments for receptionist payment history tab"
    )
    public ResponseEntity<Page<PaymentDTO>> listPayments(
            @Parameter(description = "Search by transaction code, patient name, or appointment code")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filter by status (PENDING/COMPLETED/FAILED/REFUNDED/CANCELLED)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Filter by payment method")
            @RequestParam(required = false, name = "paymentMethod") String method,
            @Parameter(description = "From date (yyyy-MM-dd)")
            @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)")
            @RequestParam(required = false) String to,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @Parameter(description = "Sort direction: ASC or DESC")
            @RequestParam(defaultValue = "DESC") String sortDir) {

        log.info("GET /receptionist/payments - search: {}, status: {}, page: {}, size: {}", search, status, page, size);

        Page<PaymentDTO> payments = paymentService.getAllPaymentsAdvanced(
                search, status, method, null, null,
                null, null, from, to,
                page, size, sortBy, sortDir);

        return ResponseEntity.ok(payments);
    }

    // ==================== STATISTICS (#16) ====================

    /**
     * #16 - Get payment statistics for receptionist dashboard
     * GET /api/receptionist/payments/statistics
     * 
     * Reuses PaymentStatsDTO (no PII in stats).
     * Same service method as AdminPaymentController.
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get payment statistics",
        description = "Dashboard statistics: today's revenue, monthly revenue, payment method distribution, pending payments, refund stats"
    )
    public ResponseEntity<PaymentStatsDTO> getPaymentStatistics(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to) {

        log.info("GET /receptionist/payments/statistics - from: {}, to: {}", from, to);

        PaymentStatsDTO stats = paymentService.getPaymentStatistics(from, to);
        return ResponseEntity.ok(stats);
    }

    // ==================== TAB 5.3 — PENDING PAYMENTS ====================

    /**
     * GET /api/receptionist/payments/pending
     * List pending payments (completed appointments but not yet paid)
     */
    @GetMapping("/pending")
    @Operation(
        summary = "Get pending payments",
        description = "List payments that are PENDING for appointments that have been COMPLETED. Supports searching by patient name, phone, or payment code."
    )
    public ResponseEntity<Page<PendingPaymentDTO>> getPendingPayments(
            @Parameter(description = "Search by patient name, phone, or payment code")
            @RequestParam(required = false) String search,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction: ASC or DESC")
            @RequestParam(defaultValue = "ASC") String sortDir) {

        log.info("GET /receptionist/payments/pending - search: {}, page: {}, size: {}", search, page, size);

        Page<PendingPaymentDTO> result = paymentService.getPendingPayments(search, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/receptionist/payments/{id}/send-payment-link
     * Send payment link to patient via email/SMS
     */
    @PostMapping("/{id}/send-payment-link")
    @Operation(
        summary = "Send payment link",
        description = "Send a payment link to the patient via email, SMS, or both"
    )
    public ResponseEntity<MessageDTO> sendPaymentLink(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody SendPaymentLinkDTO dto) {

        log.info("POST /receptionist/payments/{}/send-payment-link - via: {}", id, dto.getSendVia());

        Long currentUserId = SecurityUtil.getCurrentUserId();
        MessageDTO result = paymentService.sendPaymentLink(id, dto, currentUserId);
        return ResponseEntity.ok(result);
    }

    // ==================== TAB 5.4 — TODAY'S REVENUE ====================

    /**
     * GET /api/receptionist/payments/revenue/hourly
     * Hourly revenue breakdown for a specific date (chart data)
     */
    @GetMapping("/revenue/hourly")
    @Operation(
        summary = "Get hourly revenue",
        description = "Get hourly revenue breakdown for a specific date. Used for real-time chart on Today's Revenue tab."
    )
    public ResponseEntity<HourlyRevenueDTO> getHourlyRevenue(
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date) {

        log.info("GET /receptionist/payments/revenue/hourly - date: {}", date);

        HourlyRevenueDTO result = paymentService.getHourlyRevenue(date);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/receptionist/payments/report/end-of-day
     * Generate end-of-day report (JSON)
     */
    @GetMapping("/report/end-of-day")
    @Operation(
        summary = "Generate end-of-day report",
        description = "Generate summary report for end of business day with total revenue, transaction breakdown, and pending amounts."
    )
    public ResponseEntity<EndOfDayReportDTO> getEndOfDayReport(
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date) {

        log.info("GET /receptionist/payments/report/end-of-day - date: {}", date);

        Long currentUserId = SecurityUtil.getCurrentUserId();
        EndOfDayReportDTO report = paymentService.generateEndOfDayReport(date, currentUserId);
        return ResponseEntity.ok(report);
    }

    /**
     * GET /api/receptionist/payments/report/end-of-day/export
     * Export end-of-day report as Excel or text
     */
    @GetMapping("/report/end-of-day/export")
    @Operation(
        summary = "Export end-of-day report",
        description = "Export end-of-day report as Excel (.xlsx) or plain text (.txt) file"
    )
    public ResponseEntity<byte[]> exportEndOfDayReport(
            @Parameter(description = "Date (yyyy-MM-dd), defaults to today")
            @RequestParam(required = false) String date,
            @Parameter(description = "Export format: EXCEL or TEXT")
            @RequestParam(defaultValue = "EXCEL") String format) {

        log.info("GET /receptionist/payments/report/end-of-day/export - date: {}, format: {}", date, format);

        Long currentUserId = SecurityUtil.getCurrentUserId();
        byte[] data = paymentService.exportEndOfDayReport(date, format, currentUserId);

        String filename;
        MediaType mediaType;
        if ("EXCEL".equalsIgnoreCase(format)) {
            filename = "end-of-day-report-" + (date != null ? date : java.time.LocalDate.now().toString()) + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            filename = "end-of-day-report-" + (date != null ? date : java.time.LocalDate.now().toString()) + ".txt";
            mediaType = MediaType.TEXT_PLAIN;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(mediaType)
                .body(data);
    }

    // ==================== SEND INVOICE ====================

    /**
     * POST /api/receptionist/payments/{id}/send-invoice
     * Send invoice/receipt to patient via email (and optionally SMS)
     */
    @PostMapping("/{id}/send-invoice")
    @Operation(
        summary = "Send invoice to patient",
        description = "Send invoice/receipt to patient via email and/or SMS after successful payment"
    )
    public ResponseEntity<SendInvoiceResultDTO> sendInvoice(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @Valid @RequestBody(required = false) SendInvoiceDTO dto) {

        log.info("POST /receptionist/payments/{}/send-invoice", id);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        // Default: send email if no DTO provided
        if (dto == null) {
            dto = SendInvoiceDTO.builder()
                    .sendEmail(true)
                    .sendSms(false)
                    .build();
        }

        SendInvoiceResultDTO result = invoiceDeliveryService.sendInvoice(id, dto, currentUserId);
        return ResponseEntity.ok(result);
    }

    // ==================== SERVICE ORDER & PRESCRIPTION RECEIPTS ====================

    /**
     * GET /api/receptionist/payments/appointments/{appointmentId}/service-orders/receipt/pdf
     * Download service orders receipt as PDF
     */
    @GetMapping("/appointments/{appointmentId}/service-orders/receipt/pdf")
    @Operation(
        summary = "Download service orders receipt PDF",
        description = "Download a receipt PDF for all paid service orders of an appointment"
    )
    public ResponseEntity<byte[]> downloadServiceOrderReceiptPdf(
            @Parameter(description = "Appointment ID") @PathVariable Long appointmentId) {

        log.info("GET /receptionist/payments/appointments/{}/service-orders/receipt/pdf", appointmentId);

        byte[] pdfBytes = invoiceDeliveryService.generateServiceOrderReceiptPdf(appointmentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=service-orders-receipt-" + appointmentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * POST /api/receptionist/payments/appointments/{appointmentId}/service-orders/send-receipt
     * Send service orders receipt to patient via email
     */
    @PostMapping("/appointments/{appointmentId}/service-orders/send-receipt")
    @Operation(
        summary = "Send service orders receipt to patient",
        description = "Send service orders receipt to patient via email"
    )
    public ResponseEntity<SendInvoiceResultDTO> sendServiceOrderReceipt(
            @Parameter(description = "Appointment ID") @PathVariable Long appointmentId,
            @Valid @RequestBody(required = false) SendInvoiceDTO dto) {

        log.info("POST /receptionist/payments/appointments/{}/service-orders/send-receipt", appointmentId);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (dto == null) {
            dto = SendInvoiceDTO.builder().sendEmail(true).sendSms(false).build();
        }

        SendInvoiceResultDTO result = invoiceDeliveryService.sendServiceOrderReceipt(appointmentId, dto, currentUserId);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/receptionist/payments/appointments/{appointmentId}/prescription/receipt/pdf
     * Download prescription receipt as PDF
     */
    @GetMapping("/appointments/{appointmentId}/prescription/receipt/pdf")
    @Operation(
        summary = "Download prescription receipt PDF",
        description = "Download a receipt PDF for the paid prescription of an appointment"
    )
    public ResponseEntity<byte[]> downloadPrescriptionReceiptPdf(
            @Parameter(description = "Appointment ID") @PathVariable Long appointmentId) {

        log.info("GET /receptionist/payments/appointments/{}/prescription/receipt/pdf", appointmentId);

        byte[] pdfBytes = invoiceDeliveryService.generatePrescriptionReceiptPdf(appointmentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=prescription-receipt-" + appointmentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * POST /api/receptionist/payments/appointments/{appointmentId}/prescription/send-receipt
     * Send prescription receipt to patient via email
     */
    @PostMapping("/appointments/{appointmentId}/prescription/send-receipt")
    @Operation(
        summary = "Send prescription receipt to patient",
        description = "Send prescription receipt to patient via email"
    )
    public ResponseEntity<SendInvoiceResultDTO> sendPrescriptionReceipt(
            @Parameter(description = "Appointment ID") @PathVariable Long appointmentId,
            @Valid @RequestBody(required = false) SendInvoiceDTO dto) {

        log.info("POST /receptionist/payments/appointments/{}/prescription/send-receipt", appointmentId);

        Long currentUserId = SecurityUtil.getCurrentUserId();

        if (dto == null) {
            dto = SendInvoiceDTO.builder().sendEmail(true).sendSms(false).build();
        }

        SendInvoiceResultDTO result = invoiceDeliveryService.sendPrescriptionReceipt(appointmentId, dto, currentUserId);
        return ResponseEntity.ok(result);
    }
}