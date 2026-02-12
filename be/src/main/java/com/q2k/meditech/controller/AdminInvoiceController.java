package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DeliveryLogDTO;
import com.q2k.meditech.dto.SendInvoiceDTO;
import com.q2k.meditech.dto.SendInvoiceResultDTO;
import com.q2k.meditech.service.InvoiceDeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Invoice Delivery Controller
 * Base path: /api/admin/payments
 * 
 * APIs for admins to manage invoice delivery (email/SMS)
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Invoice Delivery", description = "APIs for managing invoice delivery")
public class AdminInvoiceController {

    private final InvoiceDeliveryService invoiceDeliveryService;

    /**
     * POST /api/admin/payments/{id}/send-invoice
     * Send invoice via email and/or SMS
     */
    @PostMapping("/{id}/send-invoice")
    @Operation(
        summary = "Send invoice",
        description = "Send invoice to patient via email and/or SMS (manual or resend)"
    )
    public ResponseEntity<SendInvoiceResultDTO> sendInvoice(
            @Parameter(description = "Payment ID") @PathVariable Long id,
            @RequestBody(required = false) @Valid SendInvoiceDTO dto) {

        log.info("POST /admin/payments/{}/send-invoice", id);

        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L;

        // Default to sending both if not specified
        if (dto == null) {
            dto = SendInvoiceDTO.builder()
                    .sendEmail(true)
                    .sendSms(false) // SMS off by default (can be expensive)
                    .build();
        }

        SendInvoiceResultDTO result = invoiceDeliveryService.sendInvoice(id, dto, currentUserId);

        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/admin/payments/{id}/delivery-logs
     * Get delivery logs (email/SMS history)
     */
    @GetMapping("/{id}/delivery-logs")
    @Operation(
        summary = "Get delivery logs",
        description = "View email/SMS delivery history for a payment's invoice"
    )
    public ResponseEntity<List<DeliveryLogDTO>> getDeliveryLogs(
            @Parameter(description = "Payment ID") @PathVariable Long id) {

        log.info("GET /admin/payments/{}/delivery-logs", id);

        List<DeliveryLogDTO> logs = invoiceDeliveryService.getDeliveryLogs(id);

        return ResponseEntity.ok(logs);
    }
}