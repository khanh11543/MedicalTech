package com.q2k.meditech.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.SecurityAuditDashboardDTO;
import com.q2k.meditech.dto.SecurityAuditLogDTO;
import com.q2k.meditech.dto.SecurityEventDTO;
import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.repository.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for Security & Audit Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SecurityAuditService {

    private final SecurityEventRepository securityEventRepository;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get security and audit dashboard statistics
     */
    public SecurityAuditDashboardDTO getDashboardStatistics() {
        log.info("Generating security audit dashboard statistics");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneDayAgo = now.minusDays(1);
        LocalDateTime oneWeekAgo = now.minusDays(7);

        // Security Events Statistics
        long totalSecurityEvents = securityEventRepository.count();
        long failedLoginAttempts = countEventsByType("FAILED_LOGIN");
        long accountLockouts = countEventsByType("ACCOUNT_LOCKOUT");
        long passwordChanges = countEventsByType("PASSWORD_CHANGED");
        long suspiciousActivities = countEventsBySeverity("HIGH");

        // Audit Logs Statistics
        long totalAuditLogs = auditLogRepository.count();
        long todayAuditLogs = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(oneDayAgo, now).size();
        long weekAuditLogs = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(oneWeekAgo, now).size();

        // Recent Security Events (last 10)
        List<SecurityEventDTO> recentSecurityEvents = getRecentSecurityEvents(10);

        // Recent Audit Logs (last 10)
        List<SecurityAuditLogDTO> recentAuditLogs = getRecentAuditLogs(10);

        // High Severity Events
        List<SecurityEventDTO> highSeverityEvents = getEventsBySeverity("HIGH", 10);

        // Top Active Users by Audit Logs
        List<SecurityAuditDashboardDTO.UserActivityDTO> topActiveUsers = getTopActiveUsers(5);

        return SecurityAuditDashboardDTO.builder()
                .totalSecurityEvents(totalSecurityEvents)
                .failedLoginAttempts(failedLoginAttempts)
                .accountLockouts(accountLockouts)
                .passwordChanges(passwordChanges)
                .suspiciousActivities(suspiciousActivities)
                .totalAuditLogs(totalAuditLogs)
                .todayAuditLogs(todayAuditLogs)
                .weekAuditLogs(weekAuditLogs)
                .recentSecurityEvents(recentSecurityEvents)
                .recentAuditLogs(recentAuditLogs)
                .highSeverityEvents(highSeverityEvents)
                .topActiveUsers(topActiveUsers)
                .generatedAt(now)
                .build();
    }

    /**
     * Get all security events
     */
    public List<SecurityEventDTO> getAllSecurityEvents() {
        return securityEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToSecurityEventDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get security events by user ID
     */
    public List<SecurityEventDTO> getSecurityEventsByUserId(Long userId) {
        return securityEventRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToSecurityEventDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all audit logs
     */
    public List<SecurityAuditLogDTO> getAllAuditLogs() {
        return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToAuditLogDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get audit logs by user ID
     */
    public List<SecurityAuditLogDTO> getAuditLogsByUserId(Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToAuditLogDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get audit logs by entity
     */
    public List<SecurityAuditLogDTO> getAuditLogsByEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .map(this::convertToAuditLogDTO)
                .collect(Collectors.toList());
    }

    // Helper methods

    private long countEventsByType(String eventType) {
        return securityEventRepository.findByEventTypeOrderByCreatedAtDesc(SecurityEventType.valueOf(eventType)).size();
    }

    private long countEventsBySeverity(String severity) {
        return securityEventRepository.findBySeverityOrderByCreatedAtDesc(SecuritySeverity.valueOf(severity)).size();
    }

    private List<SecurityEventDTO> getRecentSecurityEvents(int limit) {
        return securityEventRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).stream()
                .map(this::convertToSecurityEventDTO)
                .collect(Collectors.toList());
    }

    private List<SecurityAuditLogDTO> getRecentAuditLogs(int limit) {
        return auditLogRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).stream()
                .map(this::convertToAuditLogDTO)
                .collect(Collectors.toList());
    }

    private List<SecurityEventDTO> getEventsBySeverity(String severity, int limit) {
        return securityEventRepository.findBySeverityOrderByCreatedAtDesc(SecuritySeverity.valueOf(severity))
                .stream()
                .limit(limit)
                .map(this::convertToSecurityEventDTO)
                .collect(Collectors.toList());
    }

    private List<SecurityAuditDashboardDTO.UserActivityDTO> getTopActiveUsers(int limit) {
        // Get all audit logs and group by user
        Map<User, Long> userActivityMap = auditLogRepository.findAll().stream()
                .filter(log -> log.getUser() != null)
                .collect(Collectors.groupingBy(
                        AuditLog::getUser,
                        Collectors.counting()
                ));

        return userActivityMap.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .limit(limit)
                .map(entry -> SecurityAuditDashboardDTO.UserActivityDTO.builder()
                        .userId(entry.getKey().getId())
                        .username(entry.getKey().getEmail())
                        .fullName(entry.getKey().getFullName())
                        .activityCount(entry.getValue())
                        .lastActivity(auditLogRepository.findByUserIdOrderByCreatedAtDesc(entry.getKey().getId())
                                .stream().findFirst().map(AuditLog::getCreatedAt).orElse(null))
                        .build())
                .collect(Collectors.toList());
    }

    private SecurityEventDTO convertToSecurityEventDTO(SecurityEvent event) {
        return SecurityEventDTO.builder()
                .id(event.getId())
                .userId(event.getUser() != null ? event.getUser().getId() : null)
                .username(event.getUser() != null ? event.getUser().getEmail() : "System")
                .eventType(event.getEventType() != null ? event.getEventType().name() : null)
                .severity(event.getSeverity() != null ? event.getSeverity().name() : null)
                .ipAddress(event.getIpAddress())
                .userAgent(event.getUserAgent())
                .metadata(event.getMetadata())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private SecurityAuditLogDTO convertToAuditLogDTO(AuditLog log) {
        return SecurityAuditLogDTO.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .username(log.getUser() != null ? log.getUser().getEmail() : "System")
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .oldValues(parseJsonToMap(log.getOldValues()))
                .newValues(parseJsonToMap(log.getNewValues()))
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private Object parseJsonToMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Could not parse audit log JSON: {}", e.getMessage());
            return null;
        }
    }
}
