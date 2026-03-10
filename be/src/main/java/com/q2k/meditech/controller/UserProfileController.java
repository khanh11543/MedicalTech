package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.security.ActivityLogDTO;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.service.UserProfileService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Profile & Settings", description = "APIs for managing personal profile and settings (Tab 8)")
public class UserProfileController {

    private final UserProfileService userProfileService;

    // ==================== 8.1 Personal Info ====================

    @GetMapping("/profile")
    @Operation(summary = "Get my profile", description = "Get the authenticated user's profile information")
    public ResponseEntity<UserDTO> getProfile() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update my profile", description = "Update name, phone of the authenticated user")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody UpdateProfileDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updateProfile(userId, dto));
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar", description = "Upload a new avatar image (max 5MB, jpg/png/gif/webp)")
    public ResponseEntity<UserDTO> uploadAvatar(@RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.uploadAvatar(userId, file));
    }

    // ==================== 8.2 Display Settings ====================

    @GetMapping("/display-settings")
    @Operation(summary = "Get display settings", description = "Get language, date format, theme preferences")
    public ResponseEntity<UserDisplaySettingsDTO> getDisplaySettings() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getDisplaySettings(userId));
    }

    @PutMapping("/display-settings")
    @Operation(summary = "Update display settings", description = "Update language, date/time format, theme, currency")
    public ResponseEntity<UserDisplaySettingsDTO> updateDisplaySettings(
            @Valid @RequestBody UserDisplaySettingsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updateDisplaySettings(userId, dto));
    }

    // ==================== 8.3 Notification Preferences ====================

    @GetMapping("/notification-preferences")
    @Operation(summary = "Get notification preferences", description = "Get all notification channel and DND settings")
    public ResponseEntity<NotificationPreferenceDTO> getNotificationPreferences() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getNotificationPreferences(userId));
    }

    @PutMapping("/notification-preferences")
    @Operation(summary = "Update notification preferences", description = "Update notification channels, DND schedule, urgent-only mode")
    public ResponseEntity<NotificationPreferenceDTO> updateNotificationPreferences(
            @Valid @RequestBody NotificationPreferenceDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updateNotificationPreferences(userId, dto));
    }

    // ==================== 8.4 Printer Settings ====================

    @GetMapping("/printer-settings")
    @Operation(summary = "Get printer settings", description = "Get default printer and print preferences")
    public ResponseEntity<UserPrinterSettingsDTO> getPrinterSettings() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getPrinterSettings(userId));
    }

    @PutMapping("/printer-settings")
    @Operation(summary = "Update printer settings", description = "Set default printer, paper size, auto-print, copies")
    public ResponseEntity<UserPrinterSettingsDTO> updatePrinterSettings(
            @Valid @RequestBody UserPrinterSettingsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updatePrinterSettings(userId, dto));
    }

    @PostMapping("/printer-settings/test")
    @Operation(summary = "Test print", description = "Send a test page to the configured default printer")
    public ResponseEntity<MessageDTO> testPrint() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.testPrint(userId));
    }

    // ==================== 8.5 Quick Actions ====================

    @GetMapping("/quick-actions")
    @Operation(summary = "Get quick actions", description = "Get ordered list of dashboard quick action buttons")
    public ResponseEntity<List<UserQuickActionDTO>> getQuickActions() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getQuickActions(userId));
    }

    @PutMapping("/quick-actions")
    @Operation(summary = "Update quick actions", description = "Reorder or enable/disable quick action buttons")
    public ResponseEntity<List<UserQuickActionDTO>> updateQuickActions(
            @Valid @RequestBody UpdateQuickActionsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updateQuickActions(userId, dto));
    }

    // ==================== 8.6 Workstation Mode ====================

    @GetMapping("/workstation-settings")
    @Operation(summary = "Get workstation settings", description = "Get front desk mode, auto-lock, privacy settings")
    public ResponseEntity<UserWorkstationSettingsDTO> getWorkstationSettings() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getWorkstationSettings(userId));
    }

    @PutMapping("/workstation-settings")
    @Operation(summary = "Update workstation settings", description = "Configure front desk mode, auto-lock, screen privacy")
    public ResponseEntity<UserWorkstationSettingsDTO> updateWorkstationSettings(
            @Valid @RequestBody UserWorkstationSettingsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updateWorkstationSettings(userId, dto));
    }

    @PostMapping("/workstation-settings/pin")
    @Operation(summary = "Set PIN", description = "Set or change the auto-lock PIN (4-6 digits)")
    public ResponseEntity<MessageDTO> setPin(@Valid @RequestBody SetPinDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.setPin(userId, dto));
    }

    @PostMapping("/workstation-settings/verify-pin")
    @Operation(summary = "Verify PIN", description = "Verify the auto-lock PIN to unlock workstation")
    public ResponseEntity<MessageDTO> verifyPin(@Valid @RequestBody VerifyPinDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.verifyPin(userId, dto));
    }

    // ==================== 8.7 Data & Privacy ====================

    @GetMapping("/privacy-settings")
    @Operation(summary = "Get privacy settings", description = "Get session timeout preference")
    public ResponseEntity<UserPrivacySettingsDTO> getPrivacySettings() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId));
    }

    @PutMapping("/privacy-settings")
    @Operation(summary = "Update privacy settings", description = "Set session timeout (15/30/60 minutes)")
    public ResponseEntity<UserPrivacySettingsDTO> updatePrivacySettings(
            @Valid @RequestBody UserPrivacySettingsDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId, dto));
    }

    @PostMapping("/clear-cache")
    @Operation(summary = "Clear cache", description = "Clear the user's local browser/app cache")
    public ResponseEntity<MessageDTO> clearCache() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.clearCache(userId));
    }

    @DeleteMapping("/search-history")
    @Operation(summary = "Clear search history", description = "Delete the user's search history")
    public ResponseEntity<MessageDTO> clearSearchHistory() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(userProfileService.clearSearchHistory(userId));
    }

    @GetMapping("/activity-log")
    @Operation(summary = "Get my activity log", description = "Get paginated activity log for the authenticated user")
    public ResponseEntity<Page<ActivityLogDTO>> getActivityLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtil.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userProfileService.getOwnActivityLog(userId, pageable));
    }
}
