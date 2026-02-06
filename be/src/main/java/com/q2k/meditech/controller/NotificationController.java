package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationListResponse;
import com.q2k.meditech.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // TODO: Replace userId parameter with SecurityContext when authentication is implemented
    @GetMapping
    public ResponseEntity<NotificationListResponse> getNotifications(
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "20") Integer pageSize) {

        NotificationListResponse response = notificationService.getNotifications(
                userId, unreadOnly, pageNumber, pageSize
        );

        return ResponseEntity.ok(response);
    }

    // TODO: Replace userId parameter with SecurityContext when authentication is implemented
    @PatchMapping("/{id}/read")
    public ResponseEntity<MessageDTO> markAsRead(
            @PathVariable Long id,
            @RequestParam Long userId) {

        notificationService.markAsRead(id, userId);

        MessageDTO response = new MessageDTO("Notification marked as read", true);
        return ResponseEntity.ok(response);
    }
}
