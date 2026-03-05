package com.q2k.meditech.service;

import com.q2k.meditech.entity.UserWorkstationSetting;
import com.q2k.meditech.repository.UserWorkstationSettingRepository;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Centralized service for conditionally masking patient PII
 * based on the current receptionist's workstation privacy settings.
 *
 * If hidePhoneNumber is ON  → "***4567"
 * If hidePhoneNumber is OFF → full phone "0901234567"
 * Same logic for email.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrivacyMaskingService {

    private final UserWorkstationSettingRepository workstationSettingRepository;

    /**
     * Conditionally mask phone based on current user's workstation setting.
     */
    public String maskPhone(String phone) {
        if (phone == null) return null;
        if (shouldHidePhone()) {
            return doMaskPhone(phone);
        }
        return phone;
    }

    /**
     * Conditionally mask email based on current user's workstation setting.
     */
    public String maskEmail(String email) {
        if (email == null) return null;
        if (shouldHideEmail()) {
            return doMaskEmail(email);
        }
        return email;
    }

    /**
     * Always mask phone (static utility — for contexts where settings are not applicable).
     */
    public static String alwaysMaskPhone(String phone) {
        return doMaskPhone(phone);
    }

    /**
     * Always mask email (static utility).
     */
    public static String alwaysMaskEmail(String email) {
        return doMaskEmail(email);
    }

    // ==================== PRIVATE ====================

    private boolean shouldHidePhone() {
        try {
            Long userId = SecurityUtil.getCurrentUserId();
            if (userId == null) return true; // Default: mask if no user context
            return workstationSettingRepository.findByUserId(userId)
                    .map(UserWorkstationSetting::getHidePhoneNumber)
                    .orElse(false); // Default: don't mask (settings not created yet → show full)
        } catch (Exception e) {
            log.debug("Could not determine privacy settings, defaulting to show: {}", e.getMessage());
            return false;
        }
    }

    private boolean shouldHideEmail() {
        try {
            Long userId = SecurityUtil.getCurrentUserId();
            if (userId == null) return true;
            return workstationSettingRepository.findByUserId(userId)
                    .map(UserWorkstationSetting::getHideEmail)
                    .orElse(false);
        } catch (Exception e) {
            log.debug("Could not determine privacy settings, defaulting to show: {}", e.getMessage());
            return false;
        }
    }

    private static String doMaskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return "***" + phone.substring(phone.length() - 4);
    }

    private static String doMaskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        if (local.length() <= 2) return local.charAt(0) + "***@" + parts[1];
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + parts[1];
    }
}
