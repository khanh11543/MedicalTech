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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    
    // ========== Admin Methods ==========
    
    /**
     * List all notifications with filters (Admin)
     */
    public Page<NotificationDTO> listAllNotifications(Long userId, String type, Boolean isRead, String q, Pageable pageable) {
        Specification<Notification> spec = Specification.where(null);
        
        // Filter by user
        if (userId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("user").get("id"), userId));
        }
        
        // Filter by type
        if (type != null && !type.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }
        
        // Filter by read status
        if (isRead != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isRead"), isRead));
        }
        
        // Search in title or message
        if (q != null && !q.isEmpty()) {
            String searchPattern = "%" + q.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("title")), searchPattern),
                    cb.like(cb.lower(root.get("message")), searchPattern)
                )
            );
        }
        
        Page<Notification> page = notificationRepository.findAll(spec, pageable);
        return page.map(this::convertToDTO);
    }
    
    /**
     * Get notification statistics (Admin)
     */
    public NotificationStatsDTO getNotificationStats() {
        long totalNotifications = notificationRepository.count();
        
        // Count unread
        Specification<Notification> unreadSpec = (root, query, cb) -> cb.equal(root.get("isRead"), false);
        long totalUnread = notificationRepository.count(unreadSpec);
        long totalRead = totalNotifications - totalUnread;
        
        // Get today's start time
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime weekStart = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().minusDays(30).atStartOfDay();
        
        // Count sent today
        Specification<Notification> todaySpec = (root, query, cb) -> 
            cb.greaterThanOrEqualTo(root.get("createdAt"), todayStart);
        long sentToday = notificationRepository.count(todaySpec);
        
        // Count sent this week
        Specification<Notification> weekSpec = (root, query, cb) -> 
            cb.greaterThanOrEqualTo(root.get("createdAt"), weekStart);
        long sentThisWeek = notificationRepository.count(weekSpec);
        
        // Count sent this month
        Specification<Notification> monthSpec = (root, query, cb) -> 
            cb.greaterThanOrEqualTo(root.get("createdAt"), monthStart);
        long sentThisMonth = notificationRepository.count(monthSpec);
        
        // Count scheduled (not sent yet)
        LocalDateTime now = LocalDateTime.now();
        Specification<Notification> scheduledSpec = (root, query, cb) -> 
            cb.and(
                cb.isNotNull(root.get("scheduledAt")),
                cb.greaterThan(root.get("scheduledAt"), now),
                cb.isNull(root.get("sentAt"))
            );
        long scheduledCount = notificationRepository.count(scheduledSpec);
        
        return NotificationStatsDTO.builder()
                .totalNotifications(totalNotifications)
                .totalUnread(totalUnread)
                .totalRead(totalRead)
                .sentToday(sentToday)
                .sentThisWeek(sentThisWeek)
                .sentThisMonth(sentThisMonth)
                .scheduledCount(scheduledCount)
                .build();
    }
    
    /**
     * Create notifications for specified users (Admin)
     */
    @Transactional
    public int createNotifications(CreateNotificationDTO dto) {
        List<User> users = userRepository.findAllById(dto.getUserIds());
        
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No valid users found");
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sentAt = (dto.getScheduledAt() == null || dto.getScheduledAt().isBefore(now)) 
                ? now : null;
        
        Map<String, Object> sentVia = new HashMap<>();
        if (dto.getSendEmail()) sentVia.put("email", true);
        if (dto.getSendSms()) sentVia.put("sms", true);
        if (dto.getSendPush()) sentVia.put("push", true);
        
        List<Notification> notifications = new ArrayList<>();
        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(dto.getTitle())
                    .message(dto.getMessage())
                    .type(dto.getType())
                    .referenceType(dto.getReferenceType())
                    .referenceId(dto.getReferenceId())
                    .isRead(false)
                    .sentVia(sentVia)
                    .emailSent(dto.getSendEmail())
                    .smsSent(dto.getSendSms())
                    .pushSent(dto.getSendPush())
                    .scheduledAt(dto.getScheduledAt())
                    .sentAt(sentAt)
                    .build();
            notifications.add(notification);
        }
        
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }
    
    /**
     * Broadcast notification to all users or by role (Admin)
     */
    @Transactional
    public int broadcastNotification(BroadcastNotificationDTO dto, String role) {
        List<User> users;
        
        if (role != null && !role.isEmpty()) {
            // Filter users by role
            users = userRepository.findAll().stream()
                    .filter(user -> user.getUserRoles() != null && 
                            user.getUserRoles().stream()
                                    .anyMatch(ur -> ur.getRole().getName().equalsIgnoreCase(role)))
                    .collect(Collectors.toList());
        } else {
            // Get all users
            users = userRepository.findAll();
        }
        
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No users found to send notification");
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sentAt = (dto.getScheduledAt() == null || dto.getScheduledAt().isBefore(now)) 
                ? now : null;
        
        Map<String, Object> sentVia = new HashMap<>();
        if (dto.getSendEmail()) sentVia.put("email", true);
        if (dto.getSendSms()) sentVia.put("sms", true);
        if (dto.getSendPush()) sentVia.put("push", true);
        
        List<Notification> notifications = new ArrayList<>();
        for (User user : users) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(dto.getTitle())
                    .message(dto.getMessage())
                    .type(dto.getType())
                    .isRead(false)
                    .sentVia(sentVia)
                    .emailSent(dto.getSendEmail())
                    .smsSent(dto.getSendSms())
                    .pushSent(dto.getSendPush())
                    .scheduledAt(dto.getScheduledAt())
                    .sentAt(sentAt)
                    .build();
            notifications.add(notification);
        }
        
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }
    
    /**
     * Delete notification (Admin)
     */
    @Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        
        notificationRepository.delete(notification);
    }
}
