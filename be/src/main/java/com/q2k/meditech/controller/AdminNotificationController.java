package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Notification Management Controller
 * Base path: /api/admin/notifications
 * 
 * All endpoints require ADMIN role (will be enforced by Security config)
 */
@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Notification Management", description = "APIs for managing notifications (Admin only)")
public class AdminNotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * GET /api/admin/notifications
     * List all notifications with filters and pagination
     */
    @GetMapping
    @Operation(summary = "List all notifications", description = "Get paginated list of all notifications with optional filters")
    public ResponseEntity<Page<NotificationDTO>> listNotifications(
            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) Long userId,
            
            @Parameter(description = "Filter by notification type")
            @RequestParam(required = false) String type,
            
            @Parameter(description = "Filter by read status (true/false)")
            @RequestParam(required = false) Boolean isRead,
            
            @Parameter(description = "Search in title or message")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int pageSize,
            
            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        log.info("GET /admin/notifications - userId: {}, type: {}, isRead: {}, q: {}", userId, type, isRead, q);
        
        String safeSortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                sortBy, java.util.Set.of("createdAt", "id"), "createdAt");
        Sort sort = sortOrder.equalsIgnoreCase("asc") 
                ? Sort.by(safeSortBy).ascending() 
                : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);
        
        Page<NotificationDTO> notifications = notificationService.listAllNotifications(
                userId, type, isRead, q, pageable);
        
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * GET /api/admin/notifications/stats
     * Get notification statistics
     */
    @GetMapping("/stats")
    @Operation(summary = "Get notification statistics", description = "Get statistics about notifications")
    public ResponseEntity<NotificationStatsDTO> getNotificationStats() {
        log.info("GET /admin/notifications/stats");
        
        NotificationStatsDTO stats = notificationService.getNotificationStats();
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * POST /api/admin/notifications
     * Create and send notification to users
     */
    @PostMapping
    @Operation(summary = "Create notification", description = "Create and send notification to specified users")
    public ResponseEntity<MessageDTO> createNotification(
            @Valid @RequestBody CreateNotificationDTO dto) {
        
        log.info("POST /admin/notifications - title: {}, userId: {}", dto.getTitle(), dto.getUserId());
        
        int count = notificationService.createNotifications(dto);
        
        String message = String.format("Notification sent to %d user(s) successfully", count);
        return ResponseEntity.status(HttpStatus.CREATED).body(MessageDTO.success(message));
    }
    
    /**
     * DELETE /api/admin/notifications/{id}
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification", description = "Delete a notification by ID")
    public ResponseEntity<MessageDTO> deleteNotification(
            @Parameter(description = "Notification ID")
            @PathVariable Long id) {
        
        log.info("DELETE /admin/notifications/{}", id);
        
        notificationService.deleteNotification(id);
        
        return ResponseEntity.ok(MessageDTO.success("Notification deleted successfully"));
    }
    
    /**
     * POST /api/admin/notifications/broadcast
     * Broadcast notification to all users or by role
     */
    @PostMapping("/broadcast")
    @Operation(summary = "Broadcast notification", description = "Send notification to all users or filtered by role")
    public ResponseEntity<MessageDTO> broadcastNotification(
            @Parameter(description = "Filter by role (optional)")
            @RequestParam(required = false) String role,
            
            @Valid @RequestBody BroadcastNotificationDTO dto) {
        
        log.info("POST /admin/notifications/broadcast - role: {}, title: {}", role, dto.getTitle());
        
        int count = notificationService.broadcastNotification(dto, role);
        
        String message = String.format("Notification broadcast to %d user(s) successfully", count);
        return ResponseEntity.ok(MessageDTO.success(message));
    }
}
