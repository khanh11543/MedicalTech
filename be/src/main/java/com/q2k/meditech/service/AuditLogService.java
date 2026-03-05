package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.AuditLogDTO;
import com.q2k.meditech.dto.security.AuditLogDetailDTO;
import com.q2k.meditech.dto.security.AuditLogFilterDTO;
import com.q2k.meditech.dto.security.AuditLogStatsDTO;
import org.springframework.data.domain.Page;

/**
 * Service interface for Audit Trail management (10.3).
 */
public interface AuditLogService {

    /**
     * Get paginated & filtered audit logs.
     */
    Page<AuditLogDTO> getAuditLogs(AuditLogFilterDTO filter);

    /**
     * Get detailed audit log entry with old/new values diff and navigation.
     */
    AuditLogDetailDTO getAuditLogDetail(Long id);

    /**
     * Get audit log statistics for a given period.
     */
    AuditLogStatsDTO getAuditLogStats(String period);
}
