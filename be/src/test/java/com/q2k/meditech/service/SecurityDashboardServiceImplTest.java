package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.SecurityDashboardDTO;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityDashboardServiceImplTest {

    @Mock private SecurityEventRepository securityEventRepository;
    @Mock private BlockedIpRepository blockedIpRepository;
    @Mock private IpRuleRepository ipRuleRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private ActivityLogRepository activityLogRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private LoginAttemptRepository loginAttemptRepository;
    @Mock private InvestigationRepository investigationRepository;

    @InjectMocks
    private SecurityDashboardServiceImpl service;

    @Test
    void getSecurityDashboard_defaultPeriod() {
        when(securityEventRepository.countSince(any())).thenReturn(1L);
        when(securityEventRepository.countBySeverityAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(securityEventRepository.countByStatusAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(blockedIpRepository.countActiveBlocked()).thenReturn(0L);
        when(ipRuleRepository.count()).thenReturn(0L);
        when(auditLogRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditLogRepository.countSensitiveAccessBetween(any(), any())).thenReturn(0L);
        when(activityLogRepository.countSince(any())).thenReturn(0L);
        when(userSessionRepository.countTotalActiveSessions(any())).thenReturn(0L);
        when(userSessionRepository.countIdleSessions(any())).thenReturn(0L);
        when(loginAttemptRepository.countBySuccessBetween(anyBoolean(), any(), any())).thenReturn(0L);
        when(investigationRepository.countByStatus(any())).thenReturn(0L);
        when(investigationRepository.countOverdue(any(LocalDate.class))).thenReturn(0L);

        SecurityDashboardDTO d = service.getSecurityDashboard(null);
        assertThat(d.getPeriodLabel()).isEqualTo("Last 24 hours");
    }

    @Test
    void getSecurityDashboard_7d() {
        when(securityEventRepository.countSince(any())).thenReturn(0L);
        when(securityEventRepository.countBySeverityAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(securityEventRepository.countByStatusAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(blockedIpRepository.countActiveBlocked()).thenReturn(0L);
        when(ipRuleRepository.count()).thenReturn(0L);
        when(auditLogRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditLogRepository.countSensitiveAccessBetween(any(), any())).thenReturn(0L);
        when(activityLogRepository.countSince(any())).thenReturn(0L);
        when(userSessionRepository.countTotalActiveSessions(any())).thenReturn(0L);
        when(userSessionRepository.countIdleSessions(any())).thenReturn(0L);
        when(loginAttemptRepository.countBySuccessBetween(anyBoolean(), any(), any())).thenReturn(0L);
        when(investigationRepository.countByStatus(any())).thenReturn(0L);
        when(investigationRepository.countOverdue(any(LocalDate.class))).thenReturn(0L);

        assertThat(service.getSecurityDashboard("7d").getPeriodLabel()).isEqualTo("Last 7 days");
    }
}
