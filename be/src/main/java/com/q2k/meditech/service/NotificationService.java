package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public NotificationListResponse getNotifications(Long userId, Boolean unreadOnly, Integer pageNumber, Integer pageSize) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        Pageable pageable = PageRequest.of(
                pageNumber != null && pageNumber >= 0 ? pageNumber : 0,
                pageSize != null && pageSize > 0 ? pageSize : 20
        );

        Page<Notification> page;
        if (unreadOnly != null && unreadOnly) {
            page = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false, pageable);
        } else {
            page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<NotificationDTO> notifications = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        Long unreadCount = notificationRepository.countByUserIdAndIsRead(userId, false);

        NotificationListResponse response = new NotificationListResponse();
        response.setNotifications(notifications);
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setCurrentPage(page.getNumber());
        response.setPageSize(page.getSize());
        response.setUnreadCount(unreadCount);

        return response;
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        // Verify the notification belongs to the user
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to this user");
        }

        if (notification.getIsRead() == null || !notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        Pageable all = PageRequest.of(0, Integer.MAX_VALUE);
        Page<Notification> unread = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false, all);
        
        LocalDateTime now = LocalDateTime.now();
        int count = 0;
        for (Notification notification : unread.getContent()) {
            notification.setIsRead(true);
            notification.setReadAt(now);
            count++;
        }
        
        if (count > 0) {
            notificationRepository.saveAll(unread.getContent());
        }
        
        return count;
    }

    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setReferenceType(notification.getReferenceType());
        dto.setReferenceId(notification.getReferenceId());
        dto.setIsRead(notification.getIsRead());
        dto.setReadAt(notification.getReadAt());
        dto.setSentVia(notification.getSentVia());
        dto.setEmailSent(notification.getEmailSent());
        dto.setSmsSent(notification.getSmsSent());
        dto.setPushSent(notification.getPushSent());
        dto.setScheduledAt(notification.getScheduledAt());
        dto.setSentAt(notification.getSentAt());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
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
