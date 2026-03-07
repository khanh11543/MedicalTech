package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MomoWebhookDTO;
import com.q2k.meditech.dto.PaymentDTO;
import com.q2k.meditech.dto.WebhookMockDTO;
import com.q2k.meditech.service.PaymentService;
import com.q2k.meditech.service.WebhookSecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Payment Webhook Controller
 * Base path: /api/payments
 * 
 * Handles webhook callbacks from payment gateways
 * These endpoints are PUBLIC (no authentication required)
 */
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Webhooks", description = "Webhook endpoints for payment gateways")
public class PaymentWebhookController {

    private final PaymentService paymentService;
    private final WebhookSecurityService webhookSecurityService;

    /**
     * POST /api/payments/webhook/momo
     * MoMo payment webhook callback
     */
    @PostMapping("/webhook/momo")
    @Operation(
        summary = "MoMo webhook",
        description = "Callback from MoMo payment gateway (IPN - Instant Payment Notification)"
    )
    public ResponseEntity<Map<String, Object>> handleMomoWebhook(
            @RequestBody @Valid MomoWebhookDTO webhookDto,
            @RequestHeader(value = "X-MoMo-Signature", required = false) String signature) {

        log.info("POST /payments/webhook/momo - orderId: {}, resultCode: {}, transId: {}", 
                webhookDto.getOrderId(), webhookDto.getResultCode(), webhookDto.getTransId());

        try {
            // TODO: Verify signature if provided
            // if (signature != null && !webhookSecurityService.verifyMomoSignature(signature, ...)) {
            //     log.warn("Invalid MoMo webhook signature");
            //     return ResponseEntity.status(401).body(Map.of(
            //         "status", "error",
            //         "message", "Invalid signature"
            //     ));
            // }

            // Check idempotency - prevent duplicate processing
            String transactionId = String.valueOf(webhookDto.getTransId());
            if (webhookSecurityService.isAlreadyProcessed(transactionId)) {
                log.warn("Duplicate webhook received for transId: {}", transactionId);
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Webhook already processed",
                    "isDuplicate", true
                ));
            }

            PaymentDTO result = paymentService.handleMomoWebhook(webhookDto);

            // Return success response to MoMo
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Webhook processed successfully",
                "paymentId", result.getId()
            ));

        } catch (Exception e) {
            log.error("Error processing MoMo webhook", e);
            
            // Return error response to MoMo
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * POST /api/payments/webhook/mock
     * Mock webhook for testing (simulates gateway callback)
     * Always returns 200 OK to prevent gateway retry spam
     */
    @PostMapping("/webhook/mock")
    @Operation(
        summary = "Mock webhook (testing)",
        description = "Simulates a payment gateway callback for testing purposes. Always returns 200 OK."
    )
    public ResponseEntity<Map<String, Object>> handleMockWebhook(
            @RequestBody @Valid WebhookMockDTO mockDto) {

        log.info("POST /payments/webhook/mock - paymentId: {}, status: {}", 
                mockDto.getPaymentId(), mockDto.getStatus());

        try {
            PaymentDTO result = paymentService.handleMockWebhook(mockDto);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Webhook processed successfully",
                "paymentId", result.getId(),
                "paymentStatus", result.getPaymentStatus()
            ));
        } catch (Exception e) {
            log.error("Error processing mock webhook for paymentId: {}", mockDto.getPaymentId(), e);
            // Always return 200 OK to prevent gateway retry
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage(),
                "paymentId", mockDto.getPaymentId()
            ));
        }
    }

    /**
     * GET /api/payments/return/momo
     * MoMo return URL (optional - for web-based flows)
     * Redirects user back to frontend with payment status
     */
    @GetMapping("/return/momo")
    @Operation(
        summary = "MoMo return URL",
        description = "Return URL after MoMo payment (redirects to frontend)"
    )
    public ResponseEntity<String> handleMomoReturn(
            @RequestParam String orderId,
            @RequestParam Integer resultCode,
            @RequestParam(required = false) String message) {

        log.info("GET /payments/return/momo - orderId: {}, resultCode: {}", orderId, resultCode);

        // Build redirect URL to frontend
        String frontendUrl = "http://localhost:5173"; // TODO: Get from config
        String redirectUrl = frontendUrl + "/payment/result?orderId=" + orderId 
                + "&resultCode=" + resultCode
                + (message != null ? "&message=" + message : "");

        // Return HTML with redirect
        String html = String.format(
                "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <meta http-equiv='refresh' content='0;url=%s'>" +
                "  <title>Redirecting...</title>" +
                "</head>" +
                "<body>" +
                "  <p>Processing payment result...</p>" +
                "  <p>If not redirected, <a href='%s'>click here</a></p>" +
                "</body>" +
                "</html>",
                redirectUrl, redirectUrl);

        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(html);
    }
}