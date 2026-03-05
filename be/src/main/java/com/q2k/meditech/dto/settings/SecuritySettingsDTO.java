package com.q2k.meditech.dto.settings;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecuritySettingsDTO {

    // Password Policy
    private int minPasswordLength;
    private int passwordExpirationDays;
    private int passwordHistoryCount;
    private boolean requireUppercase;
    private boolean requireLowercase;
    private boolean requireNumbers;
    private boolean requireSpecialChars;

    // Session Management
    private int sessionTimeoutMinutes;
    private int maxConcurrentSessions;
    private boolean enableRememberMe;
    private boolean forceLogoutOnPasswordChange;

    // Two-Factor Authentication
    private boolean require2faForAdmins;
    private boolean require2faForDoctors;
    private boolean allow2faForPatients;
    private boolean enable2faAuthenticator;
    private boolean enable2faSms;
    private boolean enable2faEmail;

    // Account Lockout
    private boolean enableAccountLockout;
    private int maxFailedAttempts;
    private int lockoutDurationMinutes;
    private boolean autoUnlockAfterDuration;

    // Rate Limiting
    private boolean enableRateLimiting;
    private int apiRateLimit;
    private String rateLimitScope; // ip, user, global
    private int loginRateLimit;
    private String rateLimitAction; // block, throttle, captcha

    // Data Encryption
    private boolean encryptSensitiveData;
    private boolean encryptBackups;

    // HTTPS/SSL
    private boolean forceHttps;
    private boolean enableHsts;
}
