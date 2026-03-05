package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.SecurityDashboardDTO;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Implementation of SecurityDashboardService.
 * Aggregates statistics from all Security & Audit repositories into a single overview.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SecurityDashboardServiceImpl implements SecurityDashboardService {

    private final SecurityEventRepository securityEventRepository;
    private final BlockedIpRepository blockedIpRepository;
    private final IpRuleRepository ipRuleRepository;
    private final AuditLogRepository auditLogRepository;
    private final ActivityLogRepository activityLogRepository;
    private final UserSessionRepository userSessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final InvestigationRepository investigationRepository;

    private static final int IDLE_THRESHOLD_MINUTES = 30;

    @Override
    public SecurityDashboardDTO getSecurityDashboard(String period) {
        log.debug("Building security dashboard for period: {}", period);
        LocalDateTime from = resolveFrom(period);
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        // 10.1 Security Events
        long totalSecurityEvents = securityEventRepository.countSince(from);
        long highSeverityEvents = securityEventRepository.countBySeverityAndCreatedAtAfter(
                SecuritySeverity.HIGH, from);
        long unresolvedEvents = securityEventRepository.countByStatusAndCreatedAtAfter(
                SecurityEventStatus.NEW, from);

        // 10.2 IP Management
        long activeBlockedIps = blockedIpRepository.countActiveBlocked();
        long totalIpRules = ipRuleRepository.count();

        // 10.3 Audit Trail
        long totalAuditLogs = auditLogRepository.countBetween(from, now);
        long sensitiveAccessCount = auditLogRepository.countSensitiveAccessBetween(from, now);

        // 10.4 Activity Logs
        long totalActivities = activityLogRepository.countSince(from);

        // 10.5 Session Management
        long activeSessions = userSessionRepository.countTotalActiveSessions(now);
        LocalDateTime idleThreshold = now.minusMinutes(IDLE_THRESHOLD_MINUTES);
        long idleSessions = userSessionRepository.countIdleSessions(idleThreshold);
        long failedLoginAttempts = loginAttemptRepository.countBySuccessBetween(false, from, now);

        // 10.6 Investigations
        long openInvestigations = investigationRepository.countByStatus(InvestigationStatus.OPEN)
                + investigationRepository.countByStatus(InvestigationStatus.IN_PROGRESS);
        long overdueInvestigations = investigationRepository.countOverdue(today);

        String periodLabel = resolvePeriodLabel(period);

        return SecurityDashboardDTO.builder()
                .totalSecurityEvents(totalSecurityEvents)
                .highSeverityEvents(highSeverityEvents)
                .unresolvedEvents(unresolvedEvents)
                .activeBlockedIps(activeBlockedIps)
                .totalIpRules(totalIpRules)
                .totalAuditLogs(totalAuditLogs)
                .sensitiveAccessCount(sensitiveAccessCount)
                .totalActivities(totalActivities)
                .activeSessions(activeSessions)
                .idleSessions(idleSessions)
                .failedLoginAttempts(failedLoginAttempts)
                .openInvestigations(openInvestigations)
                .overdueInvestigations(overdueInvestigations)
                .periodLabel(periodLabel)
                .build();
    }

    private LocalDateTime resolveFrom(String period) {
        if (period == null) period = "24h";
        return switch (period) {
            case "7d" -> LocalDateTime.now().minusDays(7);
            case "30d" -> LocalDateTime.now().minusDays(30);
            case "90d" -> LocalDateTime.now().minusDays(90);
            default -> LocalDateTime.now().minusHours(24);
        };
    }

    private String resolvePeriodLabel(String period) {
        if (period == null) period = "24h";
        return switch (period) {
            case "7d" -> "Last 7 days";
            case "30d" -> "Last 30 days";
            case "90d" -> "Last 90 days";
            default -> "Last 24 hours";
        };
    }
}
