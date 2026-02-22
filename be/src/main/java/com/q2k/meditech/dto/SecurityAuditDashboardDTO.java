package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Security & Audit Dashboard Statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAuditDashboardDTO {
    
    // Security Events Statistics
    private Long totalSecurityEvents;
    private Long failedLoginAttempts;
    private Long accountLockouts;
    private Long passwordChanges;
    private Long suspiciousActivities;
    
    // Audit Logs Statistics
    private Long totalAuditLogs;
    private Long todayAuditLogs;
    private Long weekAuditLogs;
    
    // Recent Security Events (last 10)
    private List<SecurityEventDTO> recentSecurityEvents;
    
    // Recent Audit Logs (last 10)
    private List<SecurityAuditLogDTO> recentAuditLogs;
    
    // High Severity Events
    private List<SecurityEventDTO> highSeverityEvents;
    
    // Top Active Users by Audit Logs
    private List<UserActivityDTO> topActiveUsers;
    
    private LocalDateTime generatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserActivityDTO {
        private Long userId;
        private String username;
        private String fullName;
        private Long activityCount;
        private LocalDateTime lastActivity;
    }
}
