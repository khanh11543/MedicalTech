package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.ActivityLogFilterDTO;
import com.q2k.meditech.dto.security.AuditLogFilterDTO;
import com.q2k.meditech.dto.security.SecurityEventFilterDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityExportServiceTest {

    @Mock private AuditLogService auditLogService;
    @Mock private SecurityEventService securityEventService;
    @Mock private ActivityLogService activityLogService;

    @InjectMocks
    private SecurityExportService service;

    @Test
    void exportAuditLogsCsv() {
        when(auditLogService.getAuditLogs(any())).thenReturn(new PageImpl<>(List.of()));
        byte[] b = service.exportAuditLogsCsv(new AuditLogFilterDTO());
        assertThat(b.length).isGreaterThan(0);
    }

    @Test
    void exportAuditLogsExcel() throws IOException {
        when(auditLogService.getAuditLogs(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportAuditLogsExcel(new AuditLogFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportAuditLogsPdf() throws IOException {
        when(auditLogService.getAuditLogs(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportAuditLogsPdf(new AuditLogFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportSecurityEventsCsv() {
        when(securityEventService.getSecurityEvents(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportSecurityEventsCsv(new SecurityEventFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportSecurityEventsExcel() throws IOException {
        when(securityEventService.getSecurityEvents(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportSecurityEventsExcel(new SecurityEventFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportSecurityEventsPdf() throws IOException {
        when(securityEventService.getSecurityEvents(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportSecurityEventsPdf(new SecurityEventFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportActivityLogsCsv() {
        when(activityLogService.getActivityLogs(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportActivityLogsCsv(new ActivityLogFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportActivityLogsExcel() throws IOException {
        when(activityLogService.getActivityLogs(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportActivityLogsExcel(new ActivityLogFilterDTO()).length).isGreaterThan(0);
    }

    @Test
    void exportActivityLogsPdf() throws IOException {
        when(activityLogService.getActivityLogs(any())).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.exportActivityLogsPdf(new ActivityLogFilterDTO()).length).isGreaterThan(0);
    }
}
