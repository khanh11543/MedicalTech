package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.SecurityEventDTO;
import com.q2k.meditech.dto.security.SecurityEventFilterDTO;
import com.q2k.meditech.dto.security.SecurityEventStatsDTO;
import org.springframework.data.domain.Page;

/**
 * Service interface for Security Events management (10.1).
 */
public interface SecurityEventService {

    /**
     * Get paginated & filtered security events.
     */
    Page<SecurityEventDTO> getSecurityEvents(SecurityEventFilterDTO filter);

    /**
     * Get a single security event by ID.
     */
    SecurityEventDTO getSecurityEventById(Long id);

    /**
     * Mark a security event as REVIEWED.
     */
    SecurityEventDTO reviewSecurityEvent(Long id, Long reviewerId);

    /**
     * Resolve a security event with a resolution note.
     */
    SecurityEventDTO resolveSecurityEvent(Long id, Long resolverId, String resolutionNote);

    /**
     * Get security event statistics for a given period.
     */
    SecurityEventStatsDTO getSecurityEventStats(String period);
}
