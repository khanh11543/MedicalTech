package com.q2k.meditech.controller;

import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.service.NotificationPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/notification-preferences")
public class NotificationPreferenceController {

    @Autowired
    private NotificationPreferenceService preferenceService;

    // TODO: Replace userId parameter with SecurityContext when authentication is implemented
    @GetMapping
    public ResponseEntity<NotificationPreferenceDTO> getPreferences(@RequestParam Long userId) {
        NotificationPreferenceDTO preferences = preferenceService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    // TODO: Replace userId parameter with SecurityContext when authentication is implemented
    @PutMapping
    public ResponseEntity<NotificationPreferenceDTO> updatePreferences(
            @RequestParam Long userId,
            @RequestBody NotificationPreferenceDTO dto) {

        NotificationPreferenceDTO updated = preferenceService.updatePreferences(userId, dto);
        return ResponseEntity.ok(updated);
    }
}
