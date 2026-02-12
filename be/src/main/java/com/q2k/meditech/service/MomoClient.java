package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * MoMo Payment Gateway Client
 * Handles integration with MoMo payment service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MomoClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${DEV_MOMO_ENDPOINT}")
    private String momoEndpoint;

    @Value("${DEV_ACCESS_KEY}")
    private String accessKey;

    @Value("${DEV_PARTNER_CODE}")
    private String partnerCode;

    @Value("${DEV_SECRET_KEY}")
    private String secretKey;

    @Value("${DEV_MOMO_RETURN_URL}")
    private String returnUrl;

    @Value("${DEV_MOMO_IPN_URL}")
    private String ipnUrl;

    @Value("${DEV_MOMO_REQUEST_TYPE}")
    private String requestType;
    
    @Value("${CREATE_URL}")
    private String createUrl;

    /**
     * Create payment order with MoMo
     * Based on official MoMo sample: https://github.com/momo-wallet/payment
     * Signature format (alphabetical): accessKey=$accessKey&amount=$amount&extraData=$extraData
     * &ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode
     * &redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
     */
    public MomoPaymentResponse createPaymentOrder(
            String orderId,
            Long amount,
            String orderInfo,
            String extraData) {
        try {
            log.info("=== Creating MoMo Payment Order ===");
            log.info("OrderId: {}, Amount: {}", orderId, amount);
            
            // Log configuration values for debugging
            log.info("Config - partnerCode: {}, accessKey: {}", partnerCode, accessKey);
            log.info("Config - redirectUrl: {}, ipnUrl: {}", returnUrl, ipnUrl);

            String requestId = UUID.randomUUID().toString();
            String cleanExtraData = (extraData != null) ? extraData : "";
            String requestTypeValue = "captureWallet"; // For MoMo wallet payment
            
            // Build raw signature string exactly like MoMo sample code
            // Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl
            //         &orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode
            //         &redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            String rawSignature = "accessKey=" + accessKey 
                    + "&amount=" + amount 
                    + "&extraData=" + cleanExtraData 
                    + "&ipnUrl=" + ipnUrl 
                    + "&orderId=" + orderId 
                    + "&orderInfo=" + orderInfo 
                    + "&partnerCode=" + partnerCode 
                    + "&redirectUrl=" + returnUrl 
                    + "&requestId=" + requestId 
                    + "&requestType=" + requestTypeValue;
            
            log.info("--------------------RAW SIGNATURE----------------");
            log.info(rawSignature);
            
            // Create HMAC SHA256 signature
            String signature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, secretKey).hmacHex(rawSignature);
            log.info("--------------------SIGNATURE----------------");
            log.info(signature);

            // Build request body
            Map<String, Object> requestData = new LinkedHashMap<>();
            requestData.put("partnerCode", partnerCode);
            requestData.put("partnerName", "MedicalTech");
            requestData.put("storeId", "MedicalTechStore");
            requestData.put("requestId", requestId);
            requestData.put("amount", amount);
            requestData.put("orderId", orderId);
            requestData.put("orderInfo", orderInfo);
            requestData.put("redirectUrl", returnUrl);
            requestData.put("ipnUrl", ipnUrl);
            requestData.put("lang", "vi");
            requestData.put("extraData", cleanExtraData);
            requestData.put("requestType", requestTypeValue);
            requestData.put("signature", signature);

            // Call MoMo API
            String apiUrl = momoEndpoint + createUrl;
            log.info("Calling MoMo API: {}", apiUrl);
            
            String requestBody = objectMapper.writeValueAsString(requestData);
            log.info("MoMo request body: {}", requestBody);

            // Make HTTP call to MoMo
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(requestBody, headers);
            
            org.springframework.http.ResponseEntity<String> responseEntity;
            try {
                responseEntity = restTemplate.exchange(apiUrl, org.springframework.http.HttpMethod.POST, entity, String.class);
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                log.error("MoMo API HTTP error: {}", e.getResponseBodyAsString());
                Map<String, Object> errorBody = objectMapper.readValue(e.getResponseBodyAsString(), Map.class);
                throw new RuntimeException("MoMo error: " + errorBody.get("message"));
            }
            
            Map<String, Object> responseBody = objectMapper.readValue(responseEntity.getBody(), Map.class);
            log.info("MoMo response: {}", responseBody);
            
            Integer resultCode = (Integer) responseBody.get("resultCode");
            if (resultCode != null && resultCode == 0) {
                return MomoPaymentResponse.builder()
                        .partnerCode((String) responseBody.get("partnerCode"))
                        .requestId((String) responseBody.get("requestId"))
                        .orderId((String) responseBody.get("orderId"))
                        .amount(amount)
                        .responseTime(System.currentTimeMillis())
                        .message((String) responseBody.get("message"))
                        .resultCode(resultCode)
                        .payUrl((String) responseBody.get("payUrl"))
                        .qrCodeUrl((String) responseBody.get("qrCodeUrl"))
                        .deeplink((String) responseBody.get("deeplink"))
                        .build();
            } else {
                log.error("MoMo API error: resultCode={}, message={}", resultCode, responseBody.get("message"));
                throw new RuntimeException("MoMo error [" + resultCode + "]: " + responseBody.get("message"));
            }

        } catch (Exception e) {
            log.error("Error creating MoMo payment order", e);
            throw new RuntimeException("Failed to create MoMo payment: " + e.getMessage(), e);
        }
    }

    /**
     * Query payment status from MoMo
     */
    public MomoQueryResponse queryPaymentStatus(String orderId) {
        try {
            log.info("Querying MoMo payment status - orderId: {}", orderId);

            Map<String, Object> requestData = new LinkedHashMap<>();
            requestData.put("partnerCode", partnerCode);
            requestData.put("requestId", UUID.randomUUID().toString());
            requestData.put("orderId", orderId);
            requestData.put("lang", "vi");

            String signature = generateSignature(requestData);
            requestData.put("signature", signature);

            // Call MoMo API endpoint: /query
            // Implementation would call actual MoMo API

            return MomoQueryResponse.builder()
                    .orderId(orderId)
                    .resultCode(0)
                    .message("OK")
                    .build();

        } catch (Exception e) {
            log.error("Error querying MoMo payment status", e);
            throw new RuntimeException("Failed to query MoMo payment status", e);
        }
    }

    /**
     * Refund payment with MoMo
     */
    public MomoRefundResponse refundPayment(
            String orderId,
            Long amount,
            String refundReason) {
        try {
            log.info("Refunding MoMo payment - orderId: {}, amount: {}", orderId, amount);

            Map<String, Object> requestData = new LinkedHashMap<>();
            requestData.put("partnerCode", partnerCode);
            requestData.put("orderId", orderId);
            requestData.put("requestId", UUID.randomUUID().toString());
            requestData.put("amount", amount);
            requestData.put("transId", ""); // Get from payment transaction
            requestData.put("lang", "vi");
            requestData.put("description", refundReason);

            String signature = generateSignature(requestData);
            requestData.put("signature", signature);

            // Call MoMo API endpoint: /refund
            // Implementation would call actual MoMo API

            return MomoRefundResponse.builder()
                    .orderId(orderId)
                    .resultCode(0)
                    .message("OK")
                    .build();

        } catch (Exception e) {
            log.error("Error refunding MoMo payment", e);
            throw new RuntimeException("Failed to refund MoMo payment", e);
        }
    }

    /**
     * Verify webhook signature from MoMo
     */
    public boolean verifyWebhookSignature(Map<String, Object> webhookData, String signature) {
        try {
            // Remove signature from data before signing
            Map<String, Object> dataToSign = new LinkedHashMap<>(webhookData);
            dataToSign.remove("signature");

            String computedSignature = generateSignature(dataToSign);
            boolean isValid = computedSignature.equals(signature);

            if (!isValid) {
                log.warn("Invalid webhook signature - expected: {}, got: {}", computedSignature, signature);
            }

            return isValid;
        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }

    /**
     * Generate HMAC SHA256 signature
     */
    private String generateSignature(Map<String, Object> data) {
        try {
            // Sort by key and build string
            StringBuilder signData = new StringBuilder();
            data.entrySet().stream()
                    .filter(entry -> entry.getValue() != null && !entry.getValue().toString().isEmpty())
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> {
                        if (signData.length() > 0) {
                            signData.append("&");
                        }
                        signData.append(entry.getKey()).append("=").append(entry.getValue());
                    });

            log.debug("Data to sign: {}", signData);

            // Create HMAC-SHA256
            String signature = HmacUtils.hmacSha256Hex(secretKey, signData.toString());
            log.debug("Generated signature: {}", signature);

            return signature;
        } catch (Exception e) {
            log.error("Error generating signature", e);
            throw new RuntimeException("Failed to generate signature", e);
        }
    }

    /**
     * Create mock payment response for testing
     */
    private MomoPaymentResponse createMockPaymentResponse(String orderId, Long amount) {
        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + orderId;
        String payUrl = "https://test-payment.momo.vn/pay?orderId=" + orderId + "&amount=" + amount;

        return MomoPaymentResponse.builder()
                .partnerCode(partnerCode)
                .requestId(UUID.randomUUID().toString())
                .orderId(orderId)
                .amount(amount)
                .responseTime(System.currentTimeMillis())
                .message("Success")
                .resultCode(0)
                .payUrl(payUrl)
                .qrCodeUrl(qrCodeUrl)
                .deeplink("momo://app/payment/" + orderId)
                .build();
    }

    // Response DTOs

    /**
     * MoMo Payment Response
     */
    public static class MomoPaymentResponse {
        public String partnerCode;
        public String requestId;
        public String orderId;
        public Long amount;
        public Long responseTime;
        public String message;
        public Integer resultCode;
        public String payUrl;
        public String qrCodeUrl;
        public String deeplink;

        public MomoPaymentResponse(String partnerCode, String requestId, String orderId, Long amount,
                                 Long responseTime, String message, Integer resultCode, String payUrl,
                                 String qrCodeUrl, String deeplink) {
            this.partnerCode = partnerCode;
            this.requestId = requestId;
            this.orderId = orderId;
            this.amount = amount;
            this.responseTime = responseTime;
            this.message = message;
            this.resultCode = resultCode;
            this.payUrl = payUrl;
            this.qrCodeUrl = qrCodeUrl;
            this.deeplink = deeplink;
        }

        public static MomoPaymentResponseBuilder builder() {
            return new MomoPaymentResponseBuilder();
        }

        public static class MomoPaymentResponseBuilder {
            private String partnerCode;
            private String requestId;
            private String orderId;
            private Long amount;
            private Long responseTime;
            private String message;
            private Integer resultCode;
            private String payUrl;
            private String qrCodeUrl;
            private String deeplink;

            public MomoPaymentResponseBuilder partnerCode(String partnerCode) {
                this.partnerCode = partnerCode;
                return this;
            }

            public MomoPaymentResponseBuilder requestId(String requestId) {
                this.requestId = requestId;
                return this;
            }

            public MomoPaymentResponseBuilder orderId(String orderId) {
                this.orderId = orderId;
                return this;
            }

            public MomoPaymentResponseBuilder amount(Long amount) {
                this.amount = amount;
                return this;
            }

            public MomoPaymentResponseBuilder responseTime(Long responseTime) {
                this.responseTime = responseTime;
                return this;
            }

            public MomoPaymentResponseBuilder message(String message) {
                this.message = message;
                return this;
            }

            public MomoPaymentResponseBuilder resultCode(Integer resultCode) {
                this.resultCode = resultCode;
                return this;
            }

            public MomoPaymentResponseBuilder payUrl(String payUrl) {
                this.payUrl = payUrl;
                return this;
            }

            public MomoPaymentResponseBuilder qrCodeUrl(String qrCodeUrl) {
                this.qrCodeUrl = qrCodeUrl;
                return this;
            }

            public MomoPaymentResponseBuilder deeplink(String deeplink) {
                this.deeplink = deeplink;
                return this;
            }

            public MomoPaymentResponse build() {
                return new MomoPaymentResponse(partnerCode, requestId, orderId, amount, responseTime,
                        message, resultCode, payUrl, qrCodeUrl, deeplink);
            }
        }
    }

    /**
     * MoMo Query Response
     */
    public static class MomoQueryResponse {
        public String orderId;
        public Integer resultCode;
        public String message;
        public Long transId;
        public Integer transState;

        public MomoQueryResponse(String orderId, Integer resultCode, String message, Long transId, Integer transState) {
            this.orderId = orderId;
            this.resultCode = resultCode;
            this.message = message;
            this.transId = transId;
            this.transState = transState;
        }

        public static MomoQueryResponseBuilder builder() {
            return new MomoQueryResponseBuilder();
        }

        public static class MomoQueryResponseBuilder {
            private String orderId;
            private Integer resultCode;
            private String message;
            private Long transId;
            private Integer transState;

            public MomoQueryResponseBuilder orderId(String orderId) {
                this.orderId = orderId;
                return this;
            }

            public MomoQueryResponseBuilder resultCode(Integer resultCode) {
                this.resultCode = resultCode;
                return this;
            }

            public MomoQueryResponseBuilder message(String message) {
                this.message = message;
                return this;
            }

            public MomoQueryResponseBuilder transId(Long transId) {
                this.transId = transId;
                return this;
            }

            public MomoQueryResponseBuilder transState(Integer transState) {
                this.transState = transState;
                return this;
            }

            public MomoQueryResponse build() {
                return new MomoQueryResponse(orderId, resultCode, message, transId, transState);
            }
        }
    }

    /**
     * MoMo Refund Response
     */
    public static class MomoRefundResponse {
        public String orderId;
        public Integer resultCode;
        public String message;
        public Long refundTransId;

        public MomoRefundResponse(String orderId, Integer resultCode, String message, Long refundTransId) {
            this.orderId = orderId;
            this.resultCode = resultCode;
            this.message = message;
            this.refundTransId = refundTransId;
        }

        public static MomoRefundResponseBuilder builder() {
            return new MomoRefundResponseBuilder();
        }

        public static class MomoRefundResponseBuilder {
            private String orderId;
            private Integer resultCode;
            private String message;
            private Long refundTransId;

            public MomoRefundResponseBuilder orderId(String orderId) {
                this.orderId = orderId;
                return this;
            }

            public MomoRefundResponseBuilder resultCode(Integer resultCode) {
                this.resultCode = resultCode;
                return this;
            }

            public MomoRefundResponseBuilder message(String message) {
                this.message = message;
                return this;
            }

            public MomoRefundResponseBuilder refundTransId(Long refundTransId) {
                this.refundTransId = refundTransId;
                return this;
            }

            public MomoRefundResponse build() {
                return new MomoRefundResponse(orderId, resultCode, message, refundTransId);
            }
        }
    }
}
