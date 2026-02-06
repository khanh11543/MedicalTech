package com.q2k.meditech.service;

import com.q2k.meditech.dto.NotificationDTO;
import com.q2k.meditech.dto.NotificationListResponse;
import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

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
}
