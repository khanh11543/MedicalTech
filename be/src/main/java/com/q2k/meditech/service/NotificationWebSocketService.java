package com.q2k.meditech.service;

import com.q2k.meditech.dto.NotificationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service to push real-time notifications to specific users via WebSocket (STOMP).
 *
 * Client subscribes to: /topic/notifications/{userId}
 *
 * Message format: NotificationDTO JSON
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Push a notification to a specific user in real time.
     *
     * @param userId the target user ID
     * @param dto    the notification payload
     */
    public void sendToUser(Long userId, NotificationDTO dto) {
        String destination = "/topic/notifications/" + userId;

        log.info("Pushing notification [{}] to user {} via WebSocket: {}",
                dto.getCategory(), userId, dto.getTitle());

        try {
            messagingTemplate.convertAndSend(destination, dto);
        } catch (Exception e) {
            log.error("Failed to push notification to user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Push a notification to ALL users subscribed to the global admin/receptionist channel.
     * Useful for system-wide alerts.
     *
     * Client subscribes to: /topic/notifications/broadcast
     */
    public void broadcast(NotificationDTO dto) {
        String destination = "/topic/notifications/broadcast";

        log.info("Broadcasting notification [{}]: {}", dto.getCategory(), dto.getTitle());

        try {
            messagingTemplate.convertAndSend(destination, dto);
        } catch (Exception e) {
            log.error("Failed to broadcast notification: {}", e.getMessage());
        }
    }
}
