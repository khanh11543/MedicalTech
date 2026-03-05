package com.q2k.meditech.service;

import com.q2k.meditech.dto.settings.*;

public interface SystemSettingService {

    // General Settings
    GeneralSettingsDTO getGeneralSettings();
    GeneralSettingsDTO updateGeneralSettings(GeneralSettingsDTO dto);

    // Appointment Settings
    AppointmentSettingsDTO getAppointmentSettings();
    AppointmentSettingsDTO updateAppointmentSettings(AppointmentSettingsDTO dto);

    // Payment Settings
    PaymentSettingsDTO getPaymentSettings();
    PaymentSettingsDTO updatePaymentSettings(PaymentSettingsDTO dto);
    TestConnectionDTO testPaymentGateway(String gatewayName);

    // Notification Settings
    NotificationSettingsDTO getNotificationSettings();
    NotificationSettingsDTO updateNotificationSettings(NotificationSettingsDTO dto);
    TestConnectionDTO testEmailConnection();
    TestConnectionDTO testSmsConnection();

    // Security Settings
    SecuritySettingsDTO getSecuritySettings();
    SecuritySettingsDTO updateSecuritySettings(SecuritySettingsDTO dto);
}
