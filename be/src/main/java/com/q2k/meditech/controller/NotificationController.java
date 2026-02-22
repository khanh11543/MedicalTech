package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationListResponse;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * User Notification Controller
 * Endpoints for authenticated users to manage their own notifications
 * Base path: /api/me/notifications
 */
@RestController
@RequestMapping("/me/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "User notification APIs")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * GET /api/me/notifications
     */
    @GetMapping
    @Operation(summary = "Get my notifications")
    public ResponseEntity<NotificationListResponse> getNotifications(
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

        Long userId = getAuthenticatedUserId();
        NotificationListResponse response = notificationService.getNotifications(
                userId, unreadOnly, pageNumber, pageSize);

        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/me/notifications/{id}/read
     */
    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<MessageDTO> markAsRead(@PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(MessageDTO.success("Notification marked as read"));
    }

    /**
     * PATCH /api/me/notifications/read-all
     */
    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<MessageDTO> markAllAsRead() {
        Long userId = getAuthenticatedUserId();
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(MessageDTO.success(count + " notification(s) marked as read"));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }
}
