package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Combined dashboard DTO aggregating stats from all Security & Audit sub-modules.
 * Used for the main Security Dashboard overview page.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityDashboardDTO {
    // 10.1 Security Events overview
    private long totalSecurityEvents;
    private long highSeverityEvents;
    private long unresolvedEvents;

    // 10.2 IP Management overview
    private long activeBlockedIps;
    private long totalIpRules;

    // 10.3 Audit Trail overview
    private long totalAuditLogs;
    private long sensitiveAccessCount;

    // 10.4 Activity Logs overview
    private long totalActivities;

    // 10.5 Session Management overview
    private long activeSessions;
    private long idleSessions;
    private long failedLoginAttempts;

    // 10.6 Investigations overview
    private long openInvestigations;
    private long overdueInvestigations;

    // Period context
    private String periodLabel;    // e.g. "Last 24 hours", "Last 7 days"
}
