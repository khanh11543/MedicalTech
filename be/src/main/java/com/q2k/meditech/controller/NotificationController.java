package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.service.NotificationService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Notification Center Controller
 * Base path: /api/me/notifications
 *
 * All endpoints use the current authenticated user from JWT SecurityContext.
 * Security: No PHI content. Auto-archive after 30 days. No mass delete.
 */
@RestController
@RequestMapping("/me/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "Notification center APIs for current user")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/me/notifications
     * Get paginated notifications with optional filters.
     *
     * Filter tabs: All | Unread | Appointments | Payments | Patients | System
     */
    @GetMapping
    @Operation(summary = "Get notifications",
               description = "Paginated list with filters: type (APPOINTMENT/PAYMENT/PATIENT/SYSTEM), unreadOnly, priority")
    public ResponseEntity<NotificationListResponse> getNotifications(
            @Parameter(description = "Filter by type: APPOINTMENT, PAYMENT, PATIENT, SYSTEM")
            @RequestParam(required = false) NotificationType type,

            @Parameter(description = "Show only unread")
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,

            @Parameter(description = "Filter by priority: INFO, IMPORTANT, URGENT")
            @RequestParam(required = false) NotificationPriority priority,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,

            @Parameter(description = "Page size")
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

        Long userId = SecurityUtil.getCurrentUserId();

        NotificationFilterDTO filter = NotificationFilterDTO.builder()
                .type(type)
                .priority(priority)
                .unreadOnly(unreadOnly)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        NotificationListResponse response = notificationService.getNotifications(userId, filter);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/me/notifications/unread-count
     * Lightweight endpoint for badge display — returns total + per-type unread counts.
     * Frontend polls this every 30s or uses WebSocket.
     */
    @GetMapping("/unread-count")
    @Operation(summary = "Get unread counts",
               description = "Returns total unread count and breakdown by type for badge display")
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        Long userId = SecurityUtil.getCurrentUserId();
        UnreadCountResponse response = notificationService.getUnreadCounts(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/me/notifications/{id}/read
     * Mark a single notification as read.
     */
    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark as read", description = "Mark a single notification as read")
    public ResponseEntity<MessageDTO> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(MessageDTO.success("Notification marked as read"));
    }

    /**
     * PATCH /api/me/notifications/read-all
     * Mark ALL unread notifications as read.
     */
    @PatchMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all unread notifications as read")
    public ResponseEntity<MessageDTO> markAllAsRead() {
        Long userId = SecurityUtil.getCurrentUserId();
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(MessageDTO.success(count + " notifications marked as read"));
    }

    /**
     * PATCH /api/me/notifications/{id}/acknowledge
     * Acknowledge an URGENT notification (required action for URGENT priority).
     */
    @PatchMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge URGENT notification",
               description = "Acknowledge an URGENT notification. Only applicable to URGENT priority notifications.")
    public ResponseEntity<MessageDTO> acknowledge(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        notificationService.acknowledgeNotification(id, userId);
        return ResponseEntity.ok(MessageDTO.success("Notification acknowledged"));
    }
}
