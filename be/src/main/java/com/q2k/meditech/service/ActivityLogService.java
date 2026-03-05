package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.ActivityLogDTO;
import com.q2k.meditech.dto.security.ActivityLogFilterDTO;
import com.q2k.meditech.dto.security.ActivityLogStatsDTO;
import org.springframework.data.domain.Page;

/**
 * Service interface for Activity Logs management (10.4).
 */
public interface ActivityLogService {

    /**
     * Get paginated & filtered activity logs.
     */
    Page<ActivityLogDTO> getActivityLogs(ActivityLogFilterDTO filter);

    /**
     * Get a single activity log by ID.
     */
    ActivityLogDTO getActivityLogById(Long id);

    /**
     * Get activity log statistics for a given period.
     */
    ActivityLogStatsDTO getActivityLogStats(String period);
}
