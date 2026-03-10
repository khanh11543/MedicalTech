package com.q2k.meditech.controller;

/**
 * @deprecated This controller is superseded by {@link UserProfileController} which handles
 * GET/PUT /api/me/notification-preferences with proper SecurityContext authentication.
 * Kept for reference only — not registered as a Spring controller.
 */
// @RestController — removed to avoid ambiguous mapping with UserProfileController
// @RequestMapping("/api/me/notification-preferences")
public class NotificationPreferenceController {
}
