package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.SecurityAuditDashboardDTO;
import com.q2k.meditech.dto.SecurityAuditLogDTO;
import com.q2k.meditech.dto.SecurityEventDTO;
import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.repository.SecurityEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityAuditServiceTest {

    @Mock private SecurityEventRepository securityEventRepository;
    @Mock private AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SecurityAuditService service;

    @org.junit.jupiter.api.BeforeEach
    void injectMapper() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
    }

    @Test
    void getDashboardStatistics() {
        when(securityEventRepository.count()).thenReturn(1L);
        when(securityEventRepository.findByEventTypeOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(securityEventRepository.findBySeverityOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(auditLogRepository.count()).thenReturn(2L);
        when(auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());
        when(securityEventRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        when(auditLogRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        when(auditLogRepository.findAll()).thenReturn(List.of());

        SecurityAuditDashboardDTO d = service.getDashboardStatistics();
        assertThat(d.getTotalSecurityEvents()).isEqualTo(1L);
    }

    @Test
    void getAllSecurityEvents() {
        SecurityEvent e = SecurityEvent.builder().id(1L).eventType(SecurityEventType.FAILED_LOGIN)
                .severity(SecuritySeverity.LOW).build();
        when(securityEventRepository.findAll(any(Sort.class))).thenReturn(List.of(e));

        assertThat(service.getAllSecurityEvents()).hasSize(1);
    }

    @Test
    void getSecurityEventsByUserId() {
        when(securityEventRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getSecurityEventsByUserId(1L)).isEmpty();
    }

    @Test
    void getAllAuditLogs() {
        when(auditLogRepository.findAll(any(Sort.class))).thenReturn(List.of());
        assertThat(service.getAllAuditLogs()).isEmpty();
    }

    @Test
    void getAuditLogsByUserId() {
        when(auditLogRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.getAuditLogsByUserId(1L)).isEmpty();
    }

    @Test
    void getAuditLogsByEntity() {
        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Patient", 9L)).thenReturn(List.of());
        assertThat(service.getAuditLogsByEntity("Patient", 9L)).isEmpty();
    }
}
