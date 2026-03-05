package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import org.springframework.data.domain.Page;

/**
 * Service interface for Session Management & Force Logout (10.5).
 */
public interface SessionManagementService {

    // ===== Sessions =====

    /**
     * Get paginated & filtered user sessions.
     */
    Page<UserSessionDTO> getSessions(SessionFilterDTO filter);

    /**
     * Get a single session by ID.
     */
    UserSessionDTO getSessionById(Long id);

    /**
     * Force logout — revoke sessions by IDs, user, or IP address.
     */
    int forceLogout(ForceLogoutDTO dto, Long performedByUserId);

    /**
     * Get session statistics.
     */
    SessionStatsDTO getSessionStats();

    // ===== Login Attempts =====

    /**
     * Get paginated login attempts for a user.
     */
    Page<LoginAttemptDTO> getLoginAttempts(Long userId, int page, int size);

    /**
     * Get login attempt statistics for a given period.
     */
    LoginAttemptStatsDTO getLoginAttemptStats(String period);
}
