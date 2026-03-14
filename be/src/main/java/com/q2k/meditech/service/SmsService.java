package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * SMS Service - Send SMS using eSMS.vn (Vietnamese SMS Gateway)
 * API docs: https://esms.vn/api-document
 */
@Service
@Slf4j
public class SmsService {

    @Value("${sms.provider:mock}")
    private String smsProvider;

    @Value("${esms.api.key:}")
    private String esmsApiKey;

    @Value("${esms.secret.key:}")
    private String esmsSecretKey;

    @Value("${esms.brand.name:MediTech}")
    private String esmsBrandName;

    @Value("${esms.sandbox:false}")
    private boolean esmsSandbox;

    private static final String ESMS_API_URL = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean esmsConfigured = false;

    @PostConstruct
    public void init() {
        if ("esms".equalsIgnoreCase(smsProvider)
                && esmsApiKey != null && !esmsApiKey.isEmpty()
                && esmsSecretKey != null && !esmsSecretKey.isEmpty()) {
            esmsConfigured = true;
            log.info("eSMS service initialized - Brand: {}, Sandbox: {}", esmsBrandName, esmsSandbox);
        } else {
            log.info("SMS provider: {} (eSMS not configured)", smsProvider);
        }
    }

    /**
     * Send SMS (async)
     */
    @Async
    public void sendSms(String phoneNumber, String message) {
        try {
            String normalizedPhone = normalizePhoneNumber(phoneNumber);

            if ("esms".equalsIgnoreCase(smsProvider) && esmsConfigured) {
                sendEsmsSms(normalizedPhone, message);
            } else {
                sendMockSms(normalizedPhone, message);
            }
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", phoneNumber, e);
        }
    }

    /**
     * Send invoice SMS
     */
    @Async
    public void sendInvoiceSms(String phoneNumber, String invoiceNumber, String amount) {
        String message = String.format(
                "MediTech: Invoice #%s, amount %s VND has been processed. Thank you!",
                invoiceNumber, amount);
        sendSms(phoneNumber, message);
    }

    /**
     * Send payment confirmation SMS
     */
    @Async
    public void sendPaymentConfirmationSms(String phoneNumber, String paymentCode, String amount) {
        String message = String.format(
                "MediTech: Payment successful. Code: %s, Amount: %s VND. Thank you!",
                paymentCode, amount);
        sendSms(phoneNumber, message);
    }

    /**
     * Send refund notification SMS
     */
    @Async
    public void sendRefundSms(String phoneNumber, String paymentCode, String refundAmount) {
        String message = String.format(
                "MediTech: Refund successful. Code: %s, Amount: %s VND. Funds will arrive in 3-5 days.",
                paymentCode, refundAmount);
        sendSms(phoneNumber, message);
    }

    /**
     * Normalize Vietnamese phone number for eSMS
     * eSMS accepts format: 84xxxxxxxxx (no + prefix)
     * 0326166145 -> 84326166145
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            return phone;
        }

        // Remove spaces, dashes, dots and parentheses
        phone = phone.replaceAll("[\\s\\-\\.\\(\\)]", "");

        // Remove + prefix if present
        if (phone.startsWith("+")) {
            phone = phone.substring(1);
        }

        // If starts with 0, convert to 84
        if (phone.startsWith("0")) {
            phone = "84" + phone.substring(1);
        }

        // If doesn't start with 84, add prefix
        if (!phone.startsWith("84")) {
            phone = "84" + phone;
        }

        // Validate: 84 followed by 9 digits = 11 total digits
        if (!phone.matches("84\\d{9}")) {
            log.warn("Invalid Vietnamese phone number format: {} (expected 84 + 9 digits)", phone);
            throw new RuntimeException("Invalid Vietnamese phone number: " + phone
                    + ". Expected 10 digits starting with 0 (e.g. 0326166145)");
        }

        return phone;
    }

    /**
     * Mock SMS implementation (for testing/demo)
     */
    private void sendMockSms(String phoneNumber, String message) {
        log.info("=== MOCK SMS ===");
        log.info("To: {}", phoneNumber);
        log.info("Message: {}", message);
        log.info("================");
    }

    /**
     * eSMS.vn SMS implementation
     * API: http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/
     * SmsType: 2 = Customer Care (CSKH) - requires registered brandname
     *          4 = Brandname Advertising - requires registered brandname
     *          8 = Fixed number (fixed number prefix) - no brandname needed
     */
    private void sendEsmsSms(String phoneNumber, String message) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("ApiKey", esmsApiKey);
            requestBody.put("Content", message);
            requestBody.put("Phone", phoneNumber);
            requestBody.put("SecretKey", esmsSecretKey);
            requestBody.put("IsUnicode", "0"); // 0 = no unicode, 1 = unicode

            // If brandname is registered, use SmsType=2 (CSKH)
            // Otherwise use SmsType=8 (fixed number, no brandname required)
            if (esmsBrandName != null && !esmsBrandName.isEmpty()) {
                requestBody.put("Brandname", esmsBrandName);
                requestBody.put("SmsType", "2");
            } else {
                requestBody.put("SmsType", "8");
            }

            if (esmsSandbox) {
                requestBody.put("Sandbox", "1"); // Test mode — no actual SMS sent, no charge
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            log.info("Sending eSMS to: {} via brand: {}{}", phoneNumber, esmsBrandName,
                    esmsSandbox ? " [SANDBOX]" : "");

            ResponseEntity<String> response = restTemplate.exchange(
                    ESMS_API_URL, HttpMethod.POST, entity, String.class);

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            int codeResult = responseJson.has("CodeResult") ? responseJson.get("CodeResult").asInt() : -1;
            String smsId = responseJson.has("SMSID") ? responseJson.get("SMSID").asText() : "N/A";
            String errorMessage = responseJson.has("ErrorMessage") ? responseJson.get("ErrorMessage").asText() : "";

            if (codeResult == 100) {
                log.info("eSMS sent successfully! To: {}, SMSID: {}", phoneNumber, smsId);
            } else {
                log.error("eSMS failed! To: {}, Code: {}, Error: {}", phoneNumber, codeResult, errorMessage);
                throw new RuntimeException("eSMS error (code " + codeResult + "): " + errorMessage);
            }

        } catch (Exception e) {
            if (e instanceof RuntimeException && e.getMessage().startsWith("eSMS error")) {
                throw (RuntimeException) e;
            }
            log.error("Error sending eSMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send SMS via eSMS: " + e.getMessage(), e);
        }
    }
}
