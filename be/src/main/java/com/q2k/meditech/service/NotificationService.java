package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketService webSocketService;

    // ==================== QUERY ====================

    /**
     * Get paginated notifications with advanced filters (type, priority, unreadOnly).
     */
    public NotificationListResponse getNotifications(Long userId, NotificationFilterDTO filter) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        int pageNumber = filter.getPageNumber() != null && filter.getPageNumber() >= 0 ? filter.getPageNumber() : 0;
        int pageSize = filter.getPageSize() != null && filter.getPageSize() > 0 ? filter.getPageSize() : 20;
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        Page<Notification> page;
        NotificationType type = filter.getType();
        boolean unreadOnly = Boolean.TRUE.equals(filter.getUnreadOnly());

        if (type != null && unreadOnly) {
            page = notificationRepository.findByUserIdAndTypeAndIsReadAndArchivedAtIsNullOrderByCreatedAtDesc(
                    userId, type, false, pageable);
        } else if (type != null) {
            page = notificationRepository.findByUserIdAndTypeAndArchivedAtIsNullOrderByCreatedAtDesc(
                    userId, type, pageable);
        } else if (unreadOnly) {
            page = notificationRepository.findByUserIdAndIsReadAndArchivedAtIsNullOrderByCreatedAtDesc(
                    userId, false, pageable);
        } else {
            page = notificationRepository.findByUserIdAndArchivedAtIsNullOrderByCreatedAtDesc(
                    userId, pageable);
        }

        List<NotificationDTO> notifications = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        // Unread counts
        Long totalUnread = notificationRepository.countByUserIdAndIsReadAndArchivedAtIsNull(userId, false);
        Map<String, Long> unreadByType = getUnreadCountByType(userId);

        return NotificationListResponse.builder()
                .notifications(notifications)
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .unreadCount(totalUnread)
                .unreadCountByType(unreadByType)
                .build();
    }

    /**
     * Get unread counts (total + per type) for badge display.
     */
    public UnreadCountResponse getUnreadCounts(Long userId) {
        Long total = notificationRepository.countByUserIdAndIsReadAndArchivedAtIsNull(userId, false);
        Map<String, Long> byType = getUnreadCountByType(userId);

        return UnreadCountResponse.builder()
                .total(total)
                .byType(byType)
                .build();
    }

    // ==================== ACTIONS ====================

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to this user");
        }

        if (notification.getIsRead() == null || !notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Notification {} marked as read by user {}", notificationId, userId);
        }
    }

    /**
     * Mark ALL unread notifications as read for a user.
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        int count = notificationRepository.markAllAsReadByUserId(userId, LocalDateTime.now());
        log.info("Marked {} notifications as read for user {}", count, userId);
        return count;
    }

    /**
     * Acknowledge an URGENT notification (required action).
     */
    @Transactional
    public void acknowledgeNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to this user");
        }

        if (notification.getPriority() != NotificationPriority.URGENT) {
            throw new IllegalArgumentException("Only URGENT notifications require acknowledgment");
        }

        if (Boolean.TRUE.equals(notification.getAcknowledged())) {
            return; // already acknowledged
        }

        notification.setAcknowledged(true);
        notification.setAcknowledgedAt(LocalDateTime.now());
        // Also mark as read
        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        }
        notificationRepository.save(notification);
        log.info("URGENT notification {} acknowledged by user {}", notificationId, userId);
    }

    // ==================== CREATE & SEND ====================

    /**
     * Create a notification, persist it, and push via WebSocket in real time.
     * Called internally by NotificationEventService.
     */
    @Transactional
    public Notification createAndSend(CreateNotificationDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getUserId()));

        Notification notification = Notification.builder()
                .user(user)
                .title(dto.getTitle())
                .message(dto.getMessage())
                .type(dto.getType())
                .category(dto.getCategory())
                .priority(dto.getPriority() != null ? dto.getPriority() : NotificationPriority.INFO)
                .referenceType(dto.getReferenceType())
                .referenceId(dto.getReferenceId())
                .isRead(false)
                .acknowledged(false)
                .sentAt(LocalDateTime.now())
                .build();

        notification = notificationRepository.save(notification);

        // Push real-time via WebSocket
        NotificationDTO notifDTO = convertToDTO(notification);
        webSocketService.sendToUser(user.getId(), notifDTO);

        log.info("Notification created [{}][{}] for user {}: {}",
                dto.getType(), dto.getCategory(), dto.getUserId(), dto.getTitle());

        return notification;
    }

    // ==================== ARCHIVE ====================

    /**
     * Archive notifications older than 30 days. Called by scheduler.
     */
    @Transactional
    public int archiveOldNotifications() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        int count = notificationRepository.archiveOldNotifications(LocalDateTime.now(), threshold);
        if (count > 0) {
            log.info("Archived {} notifications older than 30 days", count);
        }
        return count;
    }

    // ==================== HELPERS ====================

    private Map<String, Long> getUnreadCountByType(Long userId) {
        Map<String, Long> byType = new HashMap<>();
        for (NotificationType type : NotificationType.values()) {
            Long count = notificationRepository.countByUserIdAndIsReadAndTypeAndArchivedAtIsNull(userId, false, type);
            if (count > 0) {
                byType.put(type.name(), count);
            }
        }
        return byType;
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .category(notification.getCategory() != null ? notification.getCategory().name() : null)
                .priority(notification.getPriority() != null ? notification.getPriority().name() : "INFO")
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .acknowledged(notification.getAcknowledged())
                .acknowledgedAt(notification.getAcknowledgedAt())
                .sentVia(notification.getSentVia())
                .emailSent(notification.getEmailSent())
                .smsSent(notification.getSmsSent())
                .pushSent(notification.getPushSent())
                .scheduledAt(notification.getScheduledAt())
                .sentAt(notification.getSentAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
