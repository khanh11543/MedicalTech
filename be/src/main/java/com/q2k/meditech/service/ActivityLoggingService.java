package com.q2k.meditech.service;

import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.repository.ActivityLogRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service to record user activity into the activity_logs table.
 * All write methods are @Async so they run in a separate thread.
 * Each method opens its own transaction to avoid detached-entity issues.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLoggingService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    /**
     * Log an activity for a known User entity.
     * Re-fetches the user by ID to get a managed reference in this thread's session.
     */
    @Async
    @Transactional
    public void log(User user, ActivityType type, String description,
                    String resourceType, Long resourceId,
                    String ipAddress, String userAgent) {
        logById(user.getId(), type, description, resourceType, resourceId, ipAddress, userAgent);
    }

    /**
     * Log an activity by user ID.
     */
    @Async
    @Transactional
    public void log(Long userId, ActivityType type, String description,
                    String resourceType, Long resourceId,
                    String ipAddress, String userAgent) {
        logById(userId, type, description, resourceType, resourceId, ipAddress, userAgent);
    }

    /**
     * Simple overload without resource info.
     */
    @Async
    @Transactional
    public void log(User user, ActivityType type, String description,
                    String ipAddress, String userAgent) {
        logById(user.getId(), type, description, null, null, ipAddress, userAgent);
    }

    /**
     * Internal – always uses getReferenceById to get a managed proxy.
     */
    private void logById(Long userId, ActivityType type, String description,
                         String resourceType, Long resourceId,
                         String ipAddress, String userAgent) {
        try {
            User managedUser = userRepository.getReferenceById(userId);
            ActivityLog entry = ActivityLog.builder()
                    .user(managedUser)
                    .activityType(type)
                    .description(description)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            activityLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to write activity log for user {}: {}", userId, e.getMessage());
        }
    }
}
