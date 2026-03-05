package com.q2k.meditech.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service to broadcast real-time payment status updates via WebSocket
 * 
 * Clients subscribe to: /topic/payments/{paymentId}/status
 * 
 * Message format:
 * {
 *   "paymentId": 123,
 *   "paymentCode": "PAY-xxx",
 *   "status": "PAID",
 *   "paymentMethod": "MOMO",
 *   "timestamp": "2024-01-15T10:30:00"
 * }
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentStatusWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast payment status change to all subscribers
     */
    public void broadcastPaymentStatusChange(Long paymentId, String paymentCode,
                                              String newStatus, String paymentMethod) {
        String destination = "/topic/payments/" + paymentId + "/status";

        Map<String, Object> message = Map.of(
                "paymentId", paymentId,
                "paymentCode", paymentCode != null ? paymentCode : "",
                "status", newStatus,
                "paymentMethod", paymentMethod != null ? paymentMethod : "",
                "timestamp", LocalDateTime.now().toString()
        );

        log.info("Broadcasting payment status update: {} -> {} to {}", paymentCode, newStatus, destination);

        try {
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Failed to broadcast payment status update for payment {}: {}", paymentId, e.getMessage());
        }
    }

    /**
     * Broadcast to a receptionist-level topic for dashboard updates
     */
    public void broadcastReceptionistUpdate(String eventType, Map<String, Object> data) {
        String destination = "/topic/receptionist/payments";

        Map<String, Object> message = Map.of(
                "eventType", eventType,
                "data", data,
                "timestamp", LocalDateTime.now().toString()
        );

        log.info("Broadcasting receptionist payment event: {}", eventType);

        try {
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Failed to broadcast receptionist update: {}", e.getMessage());
        }
    }
}
