package com.q2k.meditech.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

/**
 * Webhook Security Service
 * Handles signature verification and idempotency for payment webhooks
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookSecurityService {

    @Value("${webhook.momo.secret-key}")
    private String momoSecretKey;

    // Store processed transaction IDs to prevent duplicate processing
    private final Set<String> processedTransactionIds = new HashSet<>();

    /**
     * Verify MoMo webhook signature (HMAC SHA256)
     */
    public boolean verifyMomoSignature(String signature, String data) {
        try {
            String computedSignature = computeHmacSha256(data, momoSecretKey);
            boolean isValid = computedSignature.equals(signature);

            if (!isValid) {
                log.warn("Invalid MoMo signature. Expected: {}, Got: {}", computedSignature, signature);
            }

            return isValid;

        } catch (Exception e) {
            log.error("Error verifying MoMo signature", e);
            return false;
        }
    }

    /**
     * Compute HMAC SHA256
     */
    public String computeHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);

        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error computing HMAC SHA256", e);
            throw new RuntimeException("Failed to compute signature", e);
        }
    }

    /**
     * Check if transaction has already been processed (idempotency)
     */
    public synchronized boolean isAlreadyProcessed(String transactionId) {
        if (processedTransactionIds.contains(transactionId)) {
            log.warn("Transaction already processed: {}", transactionId);
            return true;
        }

        // Mark as processed
        processedTransactionIds.add(transactionId);
        log.debug("Transaction marked as processed: {}", transactionId);
        return false;
    }

    /**
     * Clear processed transaction ID (after success, can cleanup old ones)
     */
    public synchronized void clearProcessedTransaction(String transactionId) {
        processedTransactionIds.remove(transactionId);
        log.debug("Cleared transaction from processed list: {}", transactionId);
    }

    /**
     * Get number of cached transactions
     */
    public int getCachedTransactionCount() {
        return processedTransactionIds.size();
    }

    /**
     * Clean up old processed transactions (call periodically)
     * In production, use database for permanent idempotency tracking
     */
    public synchronized void cleanup() {
        int sizeBefore = processedTransactionIds.size();
        processedTransactionIds.clear();
        log.info("Cleared {} processed transaction IDs", sizeBefore);
    }
}
