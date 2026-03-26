package com.q2k.meditech.service;

import com.q2k.meditech.dto.InventoryAuditStatsDTO;
import com.q2k.meditech.dto.InventoryLogDTO;
import org.springframework.data.domain.Page;

public interface InventoryAuditLogService {

    Page<InventoryLogDTO> getAuditLogs(
            Long medicationId, String action, String referenceType, Long userId,
            String from, String to, String search,
            int page, int size, String sortBy, String sortDir);

    InventoryLogDTO getAuditLogDetail(Long id);

    InventoryAuditStatsDTO getAuditStats();
}
