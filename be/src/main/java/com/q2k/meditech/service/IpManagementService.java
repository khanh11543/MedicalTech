package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import org.springframework.data.domain.Page;

/**
 * Service interface for IP Management (10.2 — BlockedIp + IpRule).
 */
public interface IpManagementService {

    // ===== Blocked IPs =====

    Page<BlockedIpDTO> getBlockedIps(BlockedIpFilterDTO filter);

    BlockedIpDTO getBlockedIpById(Long id);

    BlockedIpDTO blockIp(BlockIpDTO dto, Long blockedByUserId);

    BlockedIpDTO unblockIp(Long id);

    boolean isIpBlocked(String ipAddress);

    // ===== IP Rules =====

    Page<IpRuleDTO> getIpRules(IpRuleFilterDTO filter);

    IpRuleDTO getIpRuleById(Long id);

    IpRuleDTO createIpRule(CreateIpRuleDTO dto, Long createdByUserId);

    IpRuleDTO updateIpRule(Long id, UpdateIpRuleDTO dto);

    void deleteIpRule(Long id);

    // ===== Statistics =====

    IpManagementStatsDTO getIpManagementStats();
}
