package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.security.AuditLogFilterDTO;
import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceImplTest {

    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    @Test
    void getAuditLogs_returnsPage() {
        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new AuditLog())));
        Page<?> page = auditLogService.getAuditLogs(AuditLogFilterDTO.builder().build());
        assertNotNull(page);
    }

    @Test
    void getAuditLogDetail_notFound_throws() {
        when(auditLogRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> auditLogService.getAuditLogDetail(1L));
    }

    @Test
    void getAuditLogStats_returnsDto() {
        when(auditLogRepository.countBetween(any(), any())).thenReturn(0L);
        when(auditLogRepository.countSensitiveAccessBetween(any(), any())).thenReturn(0L);
        when(auditLogRepository.countDeletesBetween(any(), any())).thenReturn(0L);
        when(auditLogRepository.countByActionTypeGrouped(any(), any())).thenReturn(List.of());
        when(auditLogRepository.countByEntityTypeGrouped(any(), any())).thenReturn(List.of());
        when(auditLogRepository.countByDateGrouped(any(), any())).thenReturn(List.of());
        when(auditLogRepository.getActivityHeatmap(any(), any())).thenReturn(List.of());
        when(auditLogRepository.findMostActiveUsers(any(), any(), any())).thenReturn(List.of());
        assertNotNull(auditLogService.getAuditLogStats("7d"));
    }
}
