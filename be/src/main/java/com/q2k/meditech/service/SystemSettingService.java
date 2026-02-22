package com.q2k.meditech.service;

import com.q2k.meditech.dto.SystemSettingDTO;
import com.q2k.meditech.dto.SystemSettingUpdateDTO;
import com.q2k.meditech.entity.SystemSetting;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SystemSettingService {

    private static final Logger log = LoggerFactory.getLogger(SystemSettingService.class);

    @Autowired
    private SystemSettingRepository settingRepository;

    @Autowired
    private DataSource dataSource;

    /**
     * Seed default settings if the table is empty
     */
    @PostConstruct
    public void seedDefaultSettings() {
        // Fix column type if MySQL created it as JSON instead of TEXT (raw JDBC, outside JPA)
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("ALTER TABLE system_settings MODIFY COLUMN setting_value TEXT");
            log.info("Fixed system_settings.setting_value column to TEXT");
        } catch (Exception e) {
            log.warn("Could not alter setting_value column (may not exist yet or already TEXT): {}", e.getMessage());
        }

        if (settingRepository.count() > 0) {
            return;
        }

        log.info("Seeding default system settings...");

        // General
        createIfNotExists("app.name", "MediTech", "general", "Application Name", "Name displayed across the system", "STRING");
        createIfNotExists("app.timezone", "Asia/Ho_Chi_Minh", "general", "Timezone", "Default timezone", "STRING");
        createIfNotExists("app.locale", "vi-VN", "general", "Locale", "Default locale", "STRING");
        createIfNotExists("app.maintenance_mode", "false", "general", "Maintenance Mode", "Only admins can access when enabled", "BOOLEAN");

        // Security
        createIfNotExists("security.max_failed_attempts", "5", "security", "Max Failed Attempts", "Max failed login attempts before lock", "NUMBER");
        createIfNotExists("security.lock_duration_minutes", "30", "security", "Lock Duration (min)", "Account lock duration in minutes", "NUMBER");
        createIfNotExists("security.otp_expiry_minutes", "15", "security", "OTP Expiry (min)", "OTP validity period in minutes", "NUMBER");
        createIfNotExists("security.reset_token_expiry_minutes", "60", "security", "Reset Token Expiry (min)", "Password reset token expiry in minutes", "NUMBER");
        createIfNotExists("security.enforce_strong_password", "true", "security", "Enforce Strong Password", "Require uppercase, lowercase, number, special char", "BOOLEAN");

        // Email
        createIfNotExists("email.enabled", "true", "email", "Email Enabled", "Enable email notifications", "BOOLEAN");
        createIfNotExists("email.smtp_host", "smtp.gmail.com", "email", "SMTP Host", "SMTP server hostname", "STRING");
        createIfNotExists("email.smtp_port", "587", "email", "SMTP Port", "SMTP server port", "NUMBER");
        createIfNotExists("email.sender_email", "noreply@meditech.com", "email", "Sender Email", "From email address", "STRING");
        createIfNotExists("email.sender_name", "MediTech", "email", "Sender Name", "From display name", "STRING");

        // Payment
        createIfNotExists("payment.currency", "VND", "payment", "Currency", "Default payment currency", "STRING");
        createIfNotExists("payment.qr_expire_minutes", "10", "payment", "QR Expiry (min)", "QR code expiration time in minutes", "NUMBER");
        createIfNotExists("payment.momo_enabled", "true", "payment", "MoMo Enabled", "Enable MoMo payment", "BOOLEAN");
        createIfNotExists("payment.momo_environment", "test", "payment", "MoMo Environment", "MoMo env: test or production", "STRING");

        // Notification
        createIfNotExists("notification.sms_enabled", "true", "notification", "SMS Enabled", "Enable SMS notifications", "BOOLEAN");
        createIfNotExists("notification.sms_provider", "twilio", "notification", "SMS Provider", "SMS provider name", "STRING");
        createIfNotExists("notification.push_enabled", "false", "notification", "Push Enabled", "Enable push notifications", "BOOLEAN");

        // Appointment
        createIfNotExists("appointment.default_slot_duration", "30", "appointment", "Slot Duration (min)", "Default appointment duration in minutes", "NUMBER");
        createIfNotExists("appointment.max_advance_booking_days", "30", "appointment", "Max Advance Days", "Max days ahead for booking", "NUMBER");
        createIfNotExists("appointment.min_cancel_hours", "24", "appointment", "Min Cancel Hours", "Minimum hours notice for cancellation", "NUMBER");
        createIfNotExists("appointment.allow_weekend_booking", "false", "appointment", "Weekend Booking", "Allow bookings on weekends", "BOOLEAN");

        log.info("Default system settings seeded.");
    }

    private void createIfNotExists(String key, String value, String group,
                                    String displayName, String description, String valueType) {
        if (!settingRepository.existsBySettingKey(key)) {
            SystemSetting setting = SystemSetting.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .settingGroup(group)
                    .displayName(displayName)
                    .description(description)
                    .valueType(valueType)
                    .build();
            settingRepository.save(setting);
        }
    }

    /**
     * Get all settings
     */
    public List<SystemSettingDTO> getAllSettings() {
        return settingRepository.findAllByOrderBySettingGroupAscSettingKeyAsc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get settings grouped by settingGroup
     */
    public Map<String, List<SystemSettingDTO>> getSettingsGrouped() {
        return getAllSettings().stream()
                .collect(Collectors.groupingBy(SystemSettingDTO::getSettingGroup));
    }

    /**
     * Get settings by group
     */
    public List<SystemSettingDTO> getSettingsByGroup(String group) {
        return settingRepository.findBySettingGroupOrderBySettingKeyAsc(group)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single setting by key
     */
    public SystemSettingDTO getSettingByKey(String key) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("SystemSetting", "key", key));
        return convertToDTO(setting);
    }

    /**
     * Update a single setting
     */
    @Transactional
    public SystemSettingDTO updateSetting(Long id, SystemSettingUpdateDTO dto) {
        SystemSetting setting = settingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SystemSetting", "id", id));

        if (dto.getSettingValue() != null) setting.setSettingValue(dto.getSettingValue());
        if (dto.getDisplayName() != null) setting.setDisplayName(dto.getDisplayName());
        if (dto.getDescription() != null) setting.setDescription(dto.getDescription());

        SystemSetting saved = settingRepository.save(setting);
        return convertToDTO(saved);
    }

    /**
     * Bulk update settings (list of key-value pairs)
     */
    @Transactional
    public List<SystemSettingDTO> bulkUpdate(List<SystemSettingUpdateDTO> updates) {
        return updates.stream().map(dto -> {
            SystemSetting setting = settingRepository.findBySettingKey(dto.getSettingKey())
                    .orElseThrow(() -> new ResourceNotFoundException("SystemSetting", "key", dto.getSettingKey()));
            
            if (dto.getSettingValue() != null) setting.setSettingValue(dto.getSettingValue());
            if (dto.getDisplayName() != null) setting.setDisplayName(dto.getDisplayName());
            if (dto.getDescription() != null) setting.setDescription(dto.getDescription());

            return convertToDTO(settingRepository.save(setting));
        }).collect(Collectors.toList());
    }

    private SystemSettingDTO convertToDTO(SystemSetting setting) {
        SystemSettingDTO dto = new SystemSettingDTO();
        dto.setId(setting.getId());
        dto.setSettingKey(setting.getSettingKey());
        dto.setSettingValue(setting.getSettingValue());
        dto.setSettingGroup(setting.getSettingGroup());
        dto.setDisplayName(setting.getDisplayName());
        dto.setDescription(setting.getDescription());
        dto.setValueType(setting.getValueType());
        dto.setCreatedAt(setting.getCreatedAt());
        dto.setUpdatedAt(setting.getUpdatedAt());
        return dto;
    }
}
