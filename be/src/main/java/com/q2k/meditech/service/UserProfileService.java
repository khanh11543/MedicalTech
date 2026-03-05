package com.q2k.meditech.service;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.security.ActivityLogDTO;
import com.q2k.meditech.dto.settings.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service for managing user personal settings (Tab 8)
 */
public interface UserProfileService {

    // 8.1 Personal
    UserDTO getProfile(Long userId);
    UserDTO updateProfile(Long userId, UpdateProfileDTO dto);
    UserDTO uploadAvatar(Long userId, MultipartFile file);

    // 8.2 Display
    UserDisplaySettingsDTO getDisplaySettings(Long userId);
    UserDisplaySettingsDTO updateDisplaySettings(Long userId, UserDisplaySettingsDTO dto);

    // 8.3 Notification Preferences
    NotificationPreferenceDTO getNotificationPreferences(Long userId);
    NotificationPreferenceDTO updateNotificationPreferences(Long userId, NotificationPreferenceDTO dto);

    // 8.4 Printer Settings
    UserPrinterSettingsDTO getPrinterSettings(Long userId);
    UserPrinterSettingsDTO updatePrinterSettings(Long userId, UserPrinterSettingsDTO dto);
    MessageDTO testPrint(Long userId);

    // 8.5 Quick Actions
    List<UserQuickActionDTO> getQuickActions(Long userId);
    List<UserQuickActionDTO> updateQuickActions(Long userId, UpdateQuickActionsDTO dto);

    // 8.6 Workstation Mode
    UserWorkstationSettingsDTO getWorkstationSettings(Long userId);
    UserWorkstationSettingsDTO updateWorkstationSettings(Long userId, UserWorkstationSettingsDTO dto);
    MessageDTO setPin(Long userId, SetPinDTO dto);
    MessageDTO verifyPin(Long userId, VerifyPinDTO dto);

    // 8.7 Data & Privacy
    UserPrivacySettingsDTO getPrivacySettings(Long userId);
    UserPrivacySettingsDTO updatePrivacySettings(Long userId, UserPrivacySettingsDTO dto);
    MessageDTO clearCache(Long userId);
    MessageDTO clearSearchHistory(Long userId);
    Page<ActivityLogDTO> getOwnActivityLog(Long userId, Pageable pageable);
}
