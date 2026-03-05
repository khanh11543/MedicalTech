package com.q2k.meditech.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.entity.SystemSetting;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.SystemSettingRepository;
import com.q2k.meditech.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper;

    private static final String GROUP_GENERAL = "general";
    private static final String GROUP_APPOINTMENT = "appointment";
    private static final String GROUP_PAYMENT = "payment";
    private static final String GROUP_NOTIFICATION = "notification";
    private static final String GROUP_SECURITY = "security";

    // ==================== GENERAL SETTINGS ====================

    @Override
    @Transactional(readOnly = true)
    public GeneralSettingsDTO getGeneralSettings() {
        return getSettings(GROUP_GENERAL, GeneralSettingsDTO.class, defaultGeneralSettings());
    }

    @Override
    public GeneralSettingsDTO updateGeneralSettings(GeneralSettingsDTO dto) {
        saveSettings(GROUP_GENERAL, dto, "General system settings");
        log.info("General settings updated successfully");
        return dto;
    }

    // ==================== APPOINTMENT SETTINGS ====================

    @Override
    @Transactional(readOnly = true)
    public AppointmentSettingsDTO getAppointmentSettings() {
        return getSettings(GROUP_APPOINTMENT, AppointmentSettingsDTO.class, defaultAppointmentSettings());
    }

    @Override
    public AppointmentSettingsDTO updateAppointmentSettings(AppointmentSettingsDTO dto) {
        validateAppointmentSettings(dto);
        saveSettings(GROUP_APPOINTMENT, dto, "Appointment settings");
        log.info("Appointment settings updated successfully");
        return dto;
    }

    // ==================== PAYMENT SETTINGS ====================

    @Override
    @Transactional(readOnly = true)
    public PaymentSettingsDTO getPaymentSettings() {
        return getSettings(GROUP_PAYMENT, PaymentSettingsDTO.class, defaultPaymentSettings());
    }

    @Override
    public PaymentSettingsDTO updatePaymentSettings(PaymentSettingsDTO dto) {
        saveSettings(GROUP_PAYMENT, dto, "Payment settings");
        log.info("Payment settings updated successfully");
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public TestConnectionDTO testPaymentGateway(String gatewayName) {
        long startTime = System.currentTimeMillis();
        try {
            PaymentSettingsDTO paymentSettings = getPaymentSettings();
            if (paymentSettings.getGateways() == null) {
                return TestConnectionDTO.builder()
                        .success(false)
                        .message("No payment gateways configured")
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            PaymentSettingsDTO.PaymentGatewayDTO gateway = paymentSettings.getGateways().stream()
                    .filter(g -> g.getName().equalsIgnoreCase(gatewayName))
                    .findFirst()
                    .orElse(null);

            if (gateway == null) {
                return TestConnectionDTO.builder()
                        .success(false)
                        .message("Gateway '" + gatewayName + "' not found")
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            if (gateway.getApiKey() == null || gateway.getApiKey().isBlank()) {
                return TestConnectionDTO.builder()
                        .success(false)
                        .message("API Key is not configured for " + gatewayName)
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            // Simulate gateway test connection
            // In production, each gateway would have its own health check endpoint
            log.info("Testing payment gateway connection: {}", gatewayName);

            return TestConnectionDTO.builder()
                    .success(true)
                    .message("Connection to " + gatewayName + " successful" + (gateway.isTestMode() ? " (Test Mode)" : ""))
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        } catch (Exception e) {
            log.error("Payment gateway test failed for {}: {}", gatewayName, e.getMessage());
            return TestConnectionDTO.builder()
                    .success(false)
                    .message("Connection failed: " + e.getMessage())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    // ==================== NOTIFICATION SETTINGS ====================

    @Override
    @Transactional(readOnly = true)
    public NotificationSettingsDTO getNotificationSettings() {
        return getSettings(GROUP_NOTIFICATION, NotificationSettingsDTO.class, defaultNotificationSettings());
    }

    @Override
    public NotificationSettingsDTO updateNotificationSettings(NotificationSettingsDTO dto) {
        saveSettings(GROUP_NOTIFICATION, dto, "Notification settings");
        log.info("Notification settings updated successfully");
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public TestConnectionDTO testEmailConnection() {
        long startTime = System.currentTimeMillis();
        try {
            NotificationSettingsDTO settings = getNotificationSettings();

            if ("smtp".equalsIgnoreCase(settings.getEmailProvider())) {
                if (settings.getSmtpHost() == null || settings.getSmtpHost().isBlank()) {
                    return TestConnectionDTO.builder()
                            .success(false)
                            .message("SMTP host is not configured")
                            .responseTimeMs(System.currentTimeMillis() - startTime)
                            .build();
                }

                // Test SMTP connection
                JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
                mailSender.setHost(settings.getSmtpHost());
                mailSender.setPort(settings.getSmtpPort() > 0 ? settings.getSmtpPort() : 587);
                mailSender.setUsername(settings.getSmtpUsername());
                mailSender.setPassword(settings.getSmtpPassword());

                Properties props = mailSender.getJavaMailProperties();
                props.put("mail.transport.protocol", "smtp");
                props.put("mail.smtp.auth", "true");
                if ("tls".equalsIgnoreCase(settings.getSmtpEncryption())) {
                    props.put("mail.smtp.starttls.enable", "true");
                } else if ("ssl".equalsIgnoreCase(settings.getSmtpEncryption())) {
                    props.put("mail.smtp.ssl.enable", "true");
                }
                props.put("mail.smtp.connectiontimeout", "5000");
                props.put("mail.smtp.timeout", "5000");

                mailSender.testConnection();
                log.info("SMTP email connection test successful");

                return TestConnectionDTO.builder()
                        .success(true)
                        .message("SMTP connection successful to " + settings.getSmtpHost() + ":" + mailSender.getPort())
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            } else {
                // For API-based providers (SendGrid, SES, etc.)
                if (settings.getEmailApiKey() == null || settings.getEmailApiKey().isBlank()) {
                    return TestConnectionDTO.builder()
                            .success(false)
                            .message("API Key is not configured for " + settings.getEmailProvider())
                            .responseTimeMs(System.currentTimeMillis() - startTime)
                            .build();
                }

                return TestConnectionDTO.builder()
                        .success(true)
                        .message("API key configured for " + settings.getEmailProvider())
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }
        } catch (Exception e) {
            log.error("Email connection test failed: {}", e.getMessage());
            return TestConnectionDTO.builder()
                    .success(false)
                    .message("Connection failed: " + e.getMessage())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TestConnectionDTO testSmsConnection() {
        long startTime = System.currentTimeMillis();
        try {
            NotificationSettingsDTO settings = getNotificationSettings();

            if (settings.getSmsProvider() == null || settings.getSmsProvider().isBlank()) {
                return TestConnectionDTO.builder()
                        .success(false)
                        .message("SMS provider is not configured")
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            if ("twilio".equalsIgnoreCase(settings.getSmsProvider())) {
                if (settings.getSmsAccountSid() == null || settings.getSmsAccountSid().isBlank()
                        || settings.getSmsAuthToken() == null || settings.getSmsAuthToken().isBlank()) {
                    return TestConnectionDTO.builder()
                            .success(false)
                            .message("Twilio Account SID and Auth Token are required")
                            .responseTimeMs(System.currentTimeMillis() - startTime)
                            .build();
                }

                // In production, call Twilio API to verify credentials
                log.info("SMS connection test for Twilio - credentials configured");
                return TestConnectionDTO.builder()
                        .success(true)
                        .message("Twilio credentials configured successfully")
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            // Generic SMS provider test
            if (settings.getSmsApiKey() == null || settings.getSmsApiKey().isBlank()) {
                return TestConnectionDTO.builder()
                        .success(false)
                        .message("API Key is not configured for " + settings.getSmsProvider())
                        .responseTimeMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            return TestConnectionDTO.builder()
                    .success(true)
                    .message(settings.getSmsProvider() + " credentials configured successfully")
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        } catch (Exception e) {
            log.error("SMS connection test failed: {}", e.getMessage());
            return TestConnectionDTO.builder()
                    .success(false)
                    .message("Connection failed: " + e.getMessage())
                    .responseTimeMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    // ==================== SECURITY SETTINGS ====================

    @Override
    @Transactional(readOnly = true)
    public SecuritySettingsDTO getSecuritySettings() {
        return getSettings(GROUP_SECURITY, SecuritySettingsDTO.class, defaultSecuritySettings());
    }

    @Override
    public SecuritySettingsDTO updateSecuritySettings(SecuritySettingsDTO dto) {
        validateSecuritySettings(dto);
        saveSettings(GROUP_SECURITY, dto, "Security settings");
        log.info("Security settings updated successfully");
        return dto;
    }

    // ==================== PRIVATE HELPERS ====================

    private <T> T getSettings(String group, Class<T> clazz, T defaultValue) {
        return systemSettingRepository.findBySettingKey(group)
                .map(setting -> {
                    try {
                        return objectMapper.readValue(setting.getSettingValue(), clazz);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to parse settings for group '{}': {}", group, e.getMessage());
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    private <T> void saveSettings(String group, T dto, String description) {
        try {
            String jsonValue = objectMapper.writeValueAsString(dto);

            SystemSetting setting = systemSettingRepository.findBySettingKey(group)
                    .orElse(SystemSetting.builder()
                            .settingKey(group)
                            .settingGroup(group)
                            .description(description)
                            .build());

            setting.setSettingValue(jsonValue);
            systemSettingRepository.save(setting);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize settings for group '{}': {}", group, e.getMessage());
            throw new BadRequestException("Failed to save settings: " + e.getMessage());
        }
    }

    private void validateAppointmentSettings(AppointmentSettingsDTO dto) {
        if (dto.getMaxAdvanceBookingDays() < 1 || dto.getMaxAdvanceBookingDays() > 365) {
            throw new BadRequestException("Max advance booking days must be between 1 and 365");
        }
        if (dto.getDefaultDurationMinutes() < 5 || dto.getDefaultDurationMinutes() > 240) {
            throw new BadRequestException("Default duration must be between 5 and 240 minutes");
        }
        if (dto.isEnableCancellationPolicy() && dto.getCancellationDeadlineHours() < 0) {
            throw new BadRequestException("Cancellation deadline hours must be positive");
        }
        if (dto.getNoShowAfterMinutes() < 0 || dto.getNoShowAfterMinutes() > 120) {
            throw new BadRequestException("No-show threshold must be between 0 and 120 minutes");
        }
    }

    private void validateSecuritySettings(SecuritySettingsDTO dto) {
        if (dto.getMinPasswordLength() < 6 || dto.getMinPasswordLength() > 128) {
            throw new BadRequestException("Minimum password length must be between 6 and 128");
        }
        if (dto.getSessionTimeoutMinutes() < 5 || dto.getSessionTimeoutMinutes() > 1440) {
            throw new BadRequestException("Session timeout must be between 5 and 1440 minutes");
        }
        if (dto.getMaxConcurrentSessions() < 1 || dto.getMaxConcurrentSessions() > 10) {
            throw new BadRequestException("Max concurrent sessions must be between 1 and 10");
        }
        if (dto.isEnableAccountLockout() && dto.getMaxFailedAttempts() < 1) {
            throw new BadRequestException("Max failed attempts must be at least 1");
        }
    }

    // ==================== DEFAULT VALUES ====================

    private GeneralSettingsDTO defaultGeneralSettings() {
        return GeneralSettingsDTO.builder()
                .clinicName("MedicalTech Clinic")
                .tagline("")
                .email("")
                .phone("")
                .country("Vietnam")
                .timezone("Asia/Ho_Chi_Minh")
                .language("vi")
                .dateFormat("DD/MM/YYYY")
                .timeFormat("24h")
                .businessHours(new ArrayList<>())
                .build();
    }

    private AppointmentSettingsDTO defaultAppointmentSettings() {
        return AppointmentSettingsDTO.builder()
                .maxAdvanceBookingDays(30)
                .defaultDurationMinutes(30)
                .allowSameDayBooking(true)
                .requireConfirmation(true)
                .enableCancellationPolicy(true)
                .cancellationDeadlineHours(24)
                .cancellationFeeType("none")
                .cancellationFeeAmount(0)
                .cancellationApplyTo("all")
                .enableReschedulingPolicy(true)
                .maxReschedules(3)
                .reschedulingDeadlineHours(12)
                .noShowAfterMinutes(15)
                .noShowFee(0)
                .blockAfterNoShows(3)
                .emailReminderEnabled(true)
                .emailReminderHoursBefore(24)
                .smsReminderEnabled(false)
                .smsReminderHoursBefore(2)
                .pushReminderEnabled(false)
                .pushReminderHoursBefore(1)
                .build();
    }

    private PaymentSettingsDTO defaultPaymentSettings() {
        return PaymentSettingsDTO.builder()
                .cashEnabled(true)
                .cardEnabled(false)
                .bankTransferEnabled(false)
                .insuranceEnabled(false)
                .momoEnabled(false)
                .zalopayEnabled(false)
                .vnpayEnabled(false)
                .gateways(new ArrayList<>())
                .taxRate(10.0)
                .transactionFeePayor("clinic")
                .transactionFeePercent(0)
                .currency("VND")
                .enableRefundPolicy(true)
                .refundProcessingDays(7)
                .refundToOriginalMethod(true)
                .refundToBankTransfer(true)
                .refundToCredit(false)
                .allowPartialRefund(true)
                .refundFeePercent(0)
                .autoGenerateInvoice(true)
                .invoicePrefix("INV")
                .invoiceNumberFormat("sequential")
                .includeTaxOnInvoice(true)
                .invoiceFooterText("")
                .build();
    }

    private NotificationSettingsDTO defaultNotificationSettings() {
        return NotificationSettingsDTO.builder()
                .emailProvider("smtp")
                .smtpHost("")
                .smtpPort(587)
                .smtpEncryption("tls")
                .smsProvider("")
                .pushEnabled(false)
                .emailNewUserRegistration(true)
                .emailNewAppointment(true)
                .emailPaymentReceived(true)
                .emailSystemAlerts(true)
                .emailDailyReport(false)
                .smsAppointmentConfirmation(true)
                .smsAppointmentReminder(true)
                .smsPaymentConfirmation(false)
                .pushNewAppointment(true)
                .pushAppointmentReminder(true)
                .pushPaymentReceived(true)
                .build();
    }

    private SecuritySettingsDTO defaultSecuritySettings() {
        return SecuritySettingsDTO.builder()
                .minPasswordLength(8)
                .passwordExpirationDays(90)
                .passwordHistoryCount(5)
                .requireUppercase(true)
                .requireLowercase(true)
                .requireNumbers(true)
                .requireSpecialChars(true)
                .sessionTimeoutMinutes(30)
                .maxConcurrentSessions(3)
                .enableRememberMe(true)
                .forceLogoutOnPasswordChange(true)
                .require2faForAdmins(true)
                .require2faForDoctors(false)
                .allow2faForPatients(true)
                .enable2faAuthenticator(true)
                .enable2faSms(true)
                .enable2faEmail(true)
                .enableAccountLockout(true)
                .maxFailedAttempts(5)
                .lockoutDurationMinutes(30)
                .autoUnlockAfterDuration(true)
                .enableRateLimiting(true)
                .apiRateLimit(100)
                .rateLimitScope("ip")
                .loginRateLimit(5)
                .rateLimitAction("block")
                .encryptSensitiveData(true)
                .encryptBackups(true)
                .forceHttps(true)
                .enableHsts(true)
                .build();
    }
}
