package com.q2k.meditech.service;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.security.ActivityLogDTO;
import com.q2k.meditech.dto.security.UserSummaryDTO;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final UserDisplaySettingRepository displaySettingRepository;
    private final UserPrinterSettingRepository printerSettingRepository;
    private final UserQuickActionRepository quickActionRepository;
    private final UserWorkstationSettingRepository workstationSettingRepository;
    private final UserPrivacySettingRepository privacySettingRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ActivityLoggingService activityLoggingService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    // ==================== 8.1 Personal ====================

    @Override
    @Transactional(readOnly = true)
    public UserDTO getProfile(Long userId) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return convertToUserDTO(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(Long userId, UpdateProfileDTO dto) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getPhone() != null) {
            // Check phone uniqueness
            userRepository.findByPhone(dto.getPhone()).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new BadRequestException("Phone number already in use");
                }
            });
            user.setPhone(dto.getPhone());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user {}", userId);
        activityLoggingService.log(userId, ActivityType.PROFILE_UPDATE,
                "Profile updated", "User", userId, null, null);
        return convertToUserDTO(user);
    }

    @Override
    @Transactional
    public UserDTO uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Delete old avatar if exists
        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteAvatar(user.getAvatarUrl());
        }

        String avatarUrl = fileStorageService.storeAvatar(userId, file);
        user.setAvatarUrl(avatarUrl);
        user = userRepository.save(user);

        log.info("Avatar uploaded for user {}", userId);
        return convertToUserDTO(user);
    }

    // ==================== 8.2 Display ====================

    @Override
    public UserDisplaySettingsDTO getDisplaySettings(Long userId) {
        UserDisplaySetting setting = displaySettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultDisplaySettings(userId));
        return convertToDisplayDTO(setting);
    }

    @Override
    @Transactional
    public UserDisplaySettingsDTO updateDisplaySettings(Long userId, UserDisplaySettingsDTO dto) {
        UserDisplaySetting setting = displaySettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultDisplaySettings(userId));

        if (dto.getLanguage() != null) setting.setLanguage(dto.getLanguage());
        if (dto.getDateFormat() != null) setting.setDateFormat(dto.getDateFormat());
        if (dto.getTimeFormat() != null) setting.setTimeFormat(dto.getTimeFormat());
        if (dto.getTheme() != null) setting.setTheme(dto.getTheme());
        if (dto.getCurrencyDisplay() != null) setting.setCurrencyDisplay(dto.getCurrencyDisplay());

        setting = displaySettingRepository.save(setting);
        log.info("Display settings updated for user {}", userId);
        return convertToDisplayDTO(setting);
    }

    // ==================== 8.3 Notification Preferences ====================

    @Override
    public NotificationPreferenceDTO getNotificationPreferences(Long userId) {
        NotificationPreference pref = notificationPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultNotificationPreferences(userId));
        return convertToNotificationDTO(pref);
    }

    @Override
    @Transactional
    public NotificationPreferenceDTO updateNotificationPreferences(Long userId, NotificationPreferenceDTO dto) {
        NotificationPreference pref = notificationPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultNotificationPreferences(userId));

        if (dto.getEmailEnabled() != null) pref.setEmailEnabled(dto.getEmailEnabled());
        if (dto.getSmsEnabled() != null) pref.setSmsEnabled(dto.getSmsEnabled());
        if (dto.getPushEnabled() != null) pref.setPushEnabled(dto.getPushEnabled());
        if (dto.getAppointmentReminders() != null) pref.setAppointmentReminders(dto.getAppointmentReminders());
        if (dto.getPromotionalEmails() != null) pref.setPromotionalEmails(dto.getPromotionalEmails());
        if (dto.getReminderHoursBefore() != null) pref.setReminderHoursBefore(dto.getReminderHoursBefore());
        if (dto.getDesktopEnabled() != null) pref.setDesktopEnabled(dto.getDesktopEnabled());
        if (dto.getSoundEnabled() != null) pref.setSoundEnabled(dto.getSoundEnabled());
        if (dto.getDndEnabled() != null) pref.setDndEnabled(dto.getDndEnabled());
        if (dto.getDndStartTime() != null) pref.setDndStartTime(dto.getDndStartTime());
        if (dto.getDndEndTime() != null) pref.setDndEndTime(dto.getDndEndTime());
        if (dto.getUrgentOnly() != null) pref.setUrgentOnly(dto.getUrgentOnly());

        pref = notificationPreferenceRepository.save(pref);
        log.info("Notification preferences updated for user {}", userId);
        return convertToNotificationDTO(pref);
    }

    // ==================== 8.4 Printer Settings ====================

    @Override
    public UserPrinterSettingsDTO getPrinterSettings(Long userId) {
        UserPrinterSetting setting = printerSettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPrinterSettings(userId));
        return convertToPrinterDTO(setting);
    }

    @Override
    @Transactional
    public UserPrinterSettingsDTO updatePrinterSettings(Long userId, UserPrinterSettingsDTO dto) {
        UserPrinterSetting setting = printerSettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPrinterSettings(userId));

        if (dto.getDefaultPrinter() != null) setting.setDefaultPrinter(dto.getDefaultPrinter());
        if (dto.getAutoPrintReceipt() != null) setting.setAutoPrintReceipt(dto.getAutoPrintReceipt());
        if (dto.getPaperSize() != null) setting.setPaperSize(dto.getPaperSize());
        if (dto.getPrintCopies() != null) setting.setPrintCopies(dto.getPrintCopies());

        setting = printerSettingRepository.save(setting);
        log.info("Printer settings updated for user {}", userId);
        return convertToPrinterDTO(setting);
    }

    @Override
    public MessageDTO testPrint(Long userId) {
        UserPrinterSetting setting = printerSettingRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No printer configured. Please set a default printer first."));

        if (setting.getDefaultPrinter() == null || setting.getDefaultPrinter().isBlank()) {
            throw new BadRequestException("No default printer set");
        }

        log.info("Test print requested by user {} to printer: {}", userId, setting.getDefaultPrinter());
        // In production, integrate with actual print service
        return MessageDTO.success("Test page sent to printer: " + setting.getDefaultPrinter());
    }

    // ==================== 8.5 Quick Actions ====================

    @Override
    public List<UserQuickActionDTO> getQuickActions(Long userId) {
        List<UserQuickAction> actions = quickActionRepository.findByUserIdOrderBySortOrderAsc(userId);
        if (actions.isEmpty()) {
            actions = createDefaultQuickActions(userId);
        }
        return actions.stream().map(this::convertToQuickActionDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<UserQuickActionDTO> updateQuickActions(Long userId, UpdateQuickActionsDTO dto) {
        User user = findUserById(userId);

        // Delete all existing quick actions
        quickActionRepository.deleteByUserId(userId);

        // Recreate with new order/enabled status
        List<UserQuickAction> newActions = new ArrayList<>();
        if (dto.getActions() != null) {
            for (int i = 0; i < dto.getActions().size(); i++) {
                UserQuickActionDTO actionDto = dto.getActions().get(i);
                UserQuickAction action = UserQuickAction.builder()
                        .user(user)
                        .actionKey(actionDto.getActionKey())
                        .label(actionDto.getLabel())
                        .icon(actionDto.getIcon())
                        .sortOrder(i)
                        .enabled(actionDto.getEnabled() != null ? actionDto.getEnabled() : true)
                        .build();
                newActions.add(action);
            }
        }

        newActions = quickActionRepository.saveAll(newActions);
        log.info("Quick actions updated for user {}: {} actions", userId, newActions.size());
        return newActions.stream().map(this::convertToQuickActionDTO).collect(Collectors.toList());
    }

    // ==================== 8.6 Workstation Mode ====================

    @Override
    public UserWorkstationSettingsDTO getWorkstationSettings(Long userId) {
        UserWorkstationSetting setting = workstationSettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultWorkstationSettings(userId));
        return convertToWorkstationDTO(setting);
    }

    @Override
    @Transactional
    public UserWorkstationSettingsDTO updateWorkstationSettings(Long userId, UserWorkstationSettingsDTO dto) {
        UserWorkstationSetting setting = workstationSettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultWorkstationSettings(userId));

        if (dto.getHidePhoneNumber() != null) setting.setHidePhoneNumber(dto.getHidePhoneNumber());
        if (dto.getHideEmail() != null) setting.setHideEmail(dto.getHideEmail());
        if (dto.getHidePatientNameWhenIdle() != null) setting.setHidePatientNameWhenIdle(dto.getHidePatientNameWhenIdle());
        if (dto.getLargeQueueDisplay() != null) setting.setLargeQueueDisplay(dto.getLargeQueueDisplay());
        if (dto.getAutoLockEnabled() != null) setting.setAutoLockEnabled(dto.getAutoLockEnabled());
        if (dto.getAutoLockMinutes() != null) {
            if (dto.getAutoLockMinutes() < 2 || dto.getAutoLockMinutes() > 10) {
                throw new BadRequestException("Auto lock minutes must be between 2 and 10");
            }
            setting.setAutoLockMinutes(dto.getAutoLockMinutes());
        }

        setting = workstationSettingRepository.save(setting);
        log.info("Workstation settings updated for user {}", userId);
        return convertToWorkstationDTO(setting);
    }

    @Override
    @Transactional
    public MessageDTO setPin(Long userId, SetPinDTO dto) {
        if (!dto.getPin().equals(dto.getConfirmPin())) {
            throw new BadRequestException("PIN and confirm PIN do not match");
        }

        // Verify current password for security
        User user = findUserById(userId);
        if (dto.getCurrentPassword() != null) {
            if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect");
            }
        }

        UserWorkstationSetting setting = workstationSettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultWorkstationSettings(userId));

        // PIN must differ from main password
        if (passwordEncoder.matches(dto.getPin(), user.getPasswordHash())) {
            throw new BadRequestException("PIN must be different from your main password");
        }

        setting.setPinHash(passwordEncoder.encode(dto.getPin()));
        workstationSettingRepository.save(setting);

        log.info("PIN set for user {}", userId);
        return MessageDTO.success("PIN has been set successfully");
    }

    @Override
    public MessageDTO verifyPin(Long userId, VerifyPinDTO dto) {
        UserWorkstationSetting setting = workstationSettingRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("No workstation settings found"));

        if (setting.getPinHash() == null) {
            throw new BadRequestException("No PIN has been set. Please set a PIN first.");
        }

        if (!passwordEncoder.matches(dto.getPin(), setting.getPinHash())) {
            throw new BadRequestException("Invalid PIN");
        }

        return MessageDTO.success("PIN verified successfully");
    }

    // ==================== 8.7 Data & Privacy ====================

    @Override
    public UserPrivacySettingsDTO getPrivacySettings(Long userId) {
        UserPrivacySetting setting = privacySettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPrivacySettings(userId));
        return convertToPrivacyDTO(setting);
    }

    @Override
    @Transactional
    public UserPrivacySettingsDTO updatePrivacySettings(Long userId, UserPrivacySettingsDTO dto) {
        UserPrivacySetting setting = privacySettingRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPrivacySettings(userId));

        Integer timeout = dto.getSessionTimeoutAsInt();
        if (timeout != null) {
            if (timeout != 15 && timeout != 30 && timeout != 60) {
                throw new BadRequestException("Session timeout must be 15, 30, or 60 minutes");
            }
            setting.setSessionTimeoutMinutes(timeout);
        }

        setting = privacySettingRepository.save(setting);
        log.info("Privacy settings updated for user {}", userId);
        activityLoggingService.log(userId, ActivityType.CHANGED_SETTINGS,
                "Privacy settings updated (timeout=" + setting.getSessionTimeoutMinutes() + "min)",
                "UserPrivacySetting", setting.getId(), null, null);
        return convertToPrivacyDTO(setting);
    }

    @Override
    public MessageDTO clearCache(Long userId) {
        log.info("Cache cleared for user {}", userId);
        activityLoggingService.log(userId, ActivityType.CHANGED_SETTINGS,
                "Browser cache cleared", null, null, null, null);
        return MessageDTO.success("Cache cleared successfully");
    }

    @Override
    @Transactional
    public MessageDTO clearSearchHistory(Long userId) {
        log.info("Search history cleared for user {}", userId);
        activityLoggingService.log(userId, ActivityType.CHANGED_SETTINGS,
                "Search history cleared", null, null, null, null);
        return MessageDTO.success("Search history cleared successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getOwnActivityLog(Long userId, Pageable pageable) {
        Page<ActivityLog> logs = activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return logs.map(this::convertToActivityLogDTO);
    }

    // ==================== Helper: Find User ====================

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ==================== Default Creators ====================

    private UserDisplaySetting createDefaultDisplaySettings(Long userId) {
        User user = findUserById(userId);
        UserDisplaySetting setting = UserDisplaySetting.builder()
                .user(user)
                .language("VI")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("24h")
                .theme("light")
                .currencyDisplay("VND")
                .build();
        return displaySettingRepository.save(setting);
    }

    private NotificationPreference createDefaultNotificationPreferences(Long userId) {
        User user = findUserById(userId);
        NotificationPreference pref = NotificationPreference.builder()
                .user(user)
                .emailEnabled(true)
                .smsEnabled(true)
                .pushEnabled(true)
                .appointmentReminders(true)
                .promotionalEmails(false)
                .reminderHoursBefore(24)
                .desktopEnabled(true)
                .soundEnabled(true)
                .dndEnabled(false)
                .urgentOnly(false)
                .build();
        return notificationPreferenceRepository.save(pref);
    }

    private UserPrinterSetting createDefaultPrinterSettings(Long userId) {
        User user = findUserById(userId);
        UserPrinterSetting setting = UserPrinterSetting.builder()
                .user(user)
                .autoPrintReceipt(false)
                .paperSize("A4")
                .printCopies(1)
                .build();
        return printerSettingRepository.save(setting);
    }

    private List<UserQuickAction> createDefaultQuickActions(Long userId) {
        User user = findUserById(userId);
        List<UserQuickAction> defaults = List.of(
                UserQuickAction.builder().user(user).actionKey("create_appointment").label("Create Appointment").icon("calendar-plus").sortOrder(0).enabled(true).build(),
                UserQuickAction.builder().user(user).actionKey("check_in").label("Check-in").icon("user-check").sortOrder(1).enabled(true).build(),
                UserQuickAction.builder().user(user).actionKey("collect_payment").label("Collect Payment").icon("credit-card").sortOrder(2).enabled(true).build(),
                UserQuickAction.builder().user(user).actionKey("new_patient").label("New Patient").icon("user-plus").sortOrder(3).enabled(true).build(),
                UserQuickAction.builder().user(user).actionKey("view_queue").label("View Queue").icon("list-ordered").sortOrder(4).enabled(true).build()
        );
        return quickActionRepository.saveAll(defaults);
    }

    private UserWorkstationSetting createDefaultWorkstationSettings(Long userId) {
        User user = findUserById(userId);
        UserWorkstationSetting setting = UserWorkstationSetting.builder()
                .user(user)
                .hidePhoneNumber(false)
                .hideEmail(false)
                .hidePatientNameWhenIdle(false)
                .largeQueueDisplay(false)
                .autoLockEnabled(false)
                .autoLockMinutes(5)
                .build();
        return workstationSettingRepository.save(setting);
    }

    private UserPrivacySetting createDefaultPrivacySettings(Long userId) {
        User user = findUserById(userId);
        UserPrivacySetting setting = UserPrivacySetting.builder()
                .user(user)
                .sessionTimeoutMinutes(30)
                .build();
        return privacySettingRepository.save(setting);
    }

    // ==================== DTO Converters ====================

    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .failedLoginCount(user.getFailedLoginCount())
                .lockedUntil(user.getLockedUntil())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getUserRoles() != null
                        ? user.getUserRoles().stream()
                        .map(ur -> ur.getRole().getName())
                        .collect(Collectors.toSet())
                        : null)
                .build();
    }

    private UserDisplaySettingsDTO convertToDisplayDTO(UserDisplaySetting setting) {
        return UserDisplaySettingsDTO.builder()
                .language(setting.getLanguage())
                .dateFormat(setting.getDateFormat())
                .timeFormat(setting.getTimeFormat())
                .theme(setting.getTheme())
                .currencyDisplay(setting.getCurrencyDisplay())
                .build();
    }

    private NotificationPreferenceDTO convertToNotificationDTO(NotificationPreference pref) {
        NotificationPreferenceDTO dto = new NotificationPreferenceDTO();
        dto.setId(pref.getId());
        dto.setUserId(pref.getUser() != null ? pref.getUser().getId() : null);
        dto.setEmailEnabled(pref.getEmailEnabled());
        dto.setSmsEnabled(pref.getSmsEnabled());
        dto.setPushEnabled(pref.getPushEnabled());
        dto.setAppointmentReminders(pref.getAppointmentReminders());
        dto.setPromotionalEmails(pref.getPromotionalEmails());
        dto.setReminderHoursBefore(pref.getReminderHoursBefore());
        dto.setDesktopEnabled(pref.getDesktopEnabled());
        dto.setSoundEnabled(pref.getSoundEnabled());
        dto.setDndEnabled(pref.getDndEnabled());
        dto.setDndStartTime(pref.getDndStartTime());
        dto.setDndEndTime(pref.getDndEndTime());
        dto.setUrgentOnly(pref.getUrgentOnly());
        dto.setCreatedAt(pref.getCreatedAt());
        dto.setUpdatedAt(pref.getUpdatedAt());
        return dto;
    }

    private UserPrinterSettingsDTO convertToPrinterDTO(UserPrinterSetting setting) {
        return UserPrinterSettingsDTO.builder()
                .defaultPrinter(setting.getDefaultPrinter())
                .autoPrintReceipt(setting.getAutoPrintReceipt())
                .paperSize(setting.getPaperSize())
                .printCopies(setting.getPrintCopies())
                .build();
    }

    private UserQuickActionDTO convertToQuickActionDTO(UserQuickAction action) {
        return UserQuickActionDTO.builder()
                .id(action.getId())
                .actionKey(action.getActionKey())
                .label(action.getLabel())
                .icon(action.getIcon())
                .sortOrder(action.getSortOrder())
                .enabled(action.getEnabled())
                .build();
    }

    private UserWorkstationSettingsDTO convertToWorkstationDTO(UserWorkstationSetting setting) {
        return UserWorkstationSettingsDTO.builder()
                .hidePhoneNumber(setting.getHidePhoneNumber())
                .hideEmail(setting.getHideEmail())
                .hidePatientNameWhenIdle(setting.getHidePatientNameWhenIdle())
                .largeQueueDisplay(setting.getLargeQueueDisplay())
                .autoLockEnabled(setting.getAutoLockEnabled())
                .autoLockMinutes(setting.getAutoLockMinutes())
                .hasPinSet(setting.getPinHash() != null)
                .build();
    }

    private UserPrivacySettingsDTO convertToPrivacyDTO(UserPrivacySetting setting) {
        return UserPrivacySettingsDTO.builder()
                .sessionTimeoutMinutes(String.valueOf(setting.getSessionTimeoutMinutes()))
                .build();
    }

    private ActivityLogDTO convertToActivityLogDTO(ActivityLog log) {
        return ActivityLogDTO.builder()
                .id(log.getId())
                .user(log.getUser() != null ? UserSummaryDTO.builder()
                        .id(log.getUser().getId())
                        .email(log.getUser().getEmail())
                        .fullName(log.getUser().getFullName())
                        .build() : null)
                .activityType(log.getActivityType())
                .description(log.getDescription())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .geoCountry(log.getGeoCountry())
                .geoCity(log.getGeoCity())
                .metadata(log.getMetadata())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
