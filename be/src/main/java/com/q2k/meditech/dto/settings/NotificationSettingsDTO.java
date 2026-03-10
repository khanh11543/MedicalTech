package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSettingsDTO {

    // Email Service
    private String emailProvider; // smtp, sendgrid, ses, mailgun, gmail
    private String smtpHost;
    private int smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String smtpEncryption; // tls, ssl, none
    private String emailApiKey;
    private String emailFromAddress;
    private String emailFromName;

    // SMS Service
    private String smsProvider; // twilio, vonage, aws_sns, esendex, local
    private String smsAccountSid;
    private String smsAuthToken;
    private String smsFromNumber;
    private String smsApiKey;

    // Push Notifications
    private boolean pushEnabled;
    private String fcmServerKey;
    private String fcmProjectId;
    private String apnsCertificateUrl;
    private String apnsKeyId;
    private String apnsTeamId;

    // Email Notification Preferences (admin level)
    private boolean emailNewUserRegistration;
    private boolean emailNewAppointment;
    private boolean emailPaymentReceived;
    private boolean emailSystemAlerts;
    private boolean emailDailyReport;

    // SMS Notification Preferences
    private boolean smsAppointmentConfirmation;
    private boolean smsAppointmentReminder;
    private boolean smsPaymentConfirmation;

    // Push Notification Preferences
    private boolean pushNewAppointment;
    private boolean pushAppointmentReminder;
    private boolean pushPaymentReceived;
}
