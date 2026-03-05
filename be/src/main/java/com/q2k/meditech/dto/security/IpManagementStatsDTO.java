package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Combined statistics DTO for IP Management dashboard (10.2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IpManagementStatsDTO {
    // Blocked IPs
    private long totalBlockedIps;
    private long activeBlockedIps;
    private long autoBlockedCount;
    private long manuallyBlockedCount;
    private long temporaryBlocksCount;
    private long permanentBlocksCount;

    // IP Rules
    private long totalIpRules;
    private long blockedRulesCount;
    private long whitelistedCount;
    private long flaggedCount;
}
