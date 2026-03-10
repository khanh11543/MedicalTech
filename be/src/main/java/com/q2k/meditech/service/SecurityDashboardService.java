package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.SecurityDashboardDTO;

/**
 * Service interface for the Security Dashboard overview.
 * Aggregates stats from all Security & Audit sub-modules (10.1 – 10.6).
 */
public interface SecurityDashboardService {

    /**
     * Get an aggregated security dashboard overview.
     *
     * @param period time window — "24h", "7d", "30d", "90d"
     * @return SecurityDashboardDTO
     */
    SecurityDashboardDTO getSecurityDashboard(String period);
}
