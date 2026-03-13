package com.q2k.meditech.entity.enums;

public enum SecurityEventType {
    FAILED_LOGIN,                // Failed login
    ACCOUNT_LOCKOUT,             // Account lockout
    SUSPICIOUS_LOGIN_LOCATION,   // Login from suspicious location
    MULTIPLE_FAILED_2FA,         // Multiple failed 2FA attempts
    PASSWORD_BRUTE_FORCE,        // Brute force password detected
    SQL_INJECTION_ATTEMPT,       // SQL Injection detected
    XSS_ATTEMPT,                 // XSS detected
    UNUSUAL_DATA_ACCESS,         // Unusual data access
    RAPID_API_CALLS,             // Rapid API calls
    FILE_UPLOAD_VIOLATION,       // File upload violation
    PASSWORD_CHANGED,            // Password changed
    TWO_FA_ENABLED,              // 2FA enabled
    TWO_FA_DISABLED,             // 2FA disabled
    ROLE_CHANGED,                // Role changed
    ACCOUNT_UNLOCKED             // Account unlocked
}
