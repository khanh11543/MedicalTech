package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.specification.AuditLogSpecification;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of AuditLogService (10.3 Audit Trail).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    public Page<AuditLogDTO> getAuditLogs(AuditLogFilterDTO filter) {
        log.debug("Fetching audit logs with filter: {}", filter);

        Specification<AuditLog> spec = AuditLogSpecification.withFilters(
                filter.getSearch(),
                filter.getActionTypes(),
                filter.getEntityTypes(),
                filter.getUserId(),
                filter.getIpAddress(),
                filter.getEntityId(),
                filter.getFrom(),
                filter.getTo()
        );

        Pageable pageable = createPageable(filter);
        return auditLogRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    public AuditLogDetailDTO getAuditLogDetail(Long id) {
        log.debug("Fetching audit log detail for id: {}", id);
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found with id: " + id));

        AuditLogDetailDTO.AuditLogDetailDTOBuilder builder = AuditLogDetailDTO.builder()
                .id(auditLog.getId())
                .user(toUserSummary(auditLog.getUser()))
                .action(auditLog.getAction())
                .actionType(auditLog.getActionType())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .oldValues(parseJsonToMap(auditLog.getOldValues()))
                .newValues(parseJsonToMap(auditLog.getNewValues()))
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .requestUrl(auditLog.getRequestUrl())
                .requestMethod(auditLog.getRequestMethod())
                .geoCountry(auditLog.getGeoCountry())
                .geoCity(auditLog.getGeoCity())
                .createdAt(auditLog.getCreatedAt());

        // Compute field-level diff (parse JSON strings to Map for comparison)
        builder.changes(computeFieldChanges(
                parseJsonToMap(auditLog.getOldValues()),
                parseJsonToMap(auditLog.getNewValues())));

        // Navigation: previous / next for same user
        if (auditLog.getUser() != null) {
            Long userId = auditLog.getUser().getId();
            Pageable limit = PageRequest.of(0, 1);

            List<AuditLog> prev = auditLogRepository.findPreviousByUser(userId, id, limit);
            if (!prev.isEmpty()) {
                builder.previousId(prev.get(0).getId());
            }

            List<AuditLog> next = auditLogRepository.findNextByUser(userId, id, limit);
            if (!next.isEmpty()) {
                builder.nextId(next.get(0).getId());
            }
        }

        // Related logs on same entity
        if (auditLog.getEntityType() != null && auditLog.getEntityId() != null) {
            Pageable limitRelated = PageRequest.of(0, 10);
            List<AuditLog> related = auditLogRepository.findOtherByEntity(
                    auditLog.getEntityType(), auditLog.getEntityId(), id, limitRelated);
            builder.relatedLogs(related.stream().map(this::toDTO).collect(Collectors.toList()));
        }

        return builder.build();
    }

    @Override
    public AuditLogStatsDTO getAuditLogStats(String period) {
        log.debug("Getting audit log stats for period: {}", period);
        LocalDateTime from = resolveFrom(period);
        LocalDateTime to = LocalDateTime.now();

        long totalLogs = auditLogRepository.countBetween(from, to);
        long sensitiveAccessCount = auditLogRepository.countSensitiveAccessBetween(from, to);
        long deleteCount = auditLogRepository.countDeletesBetween(from, to);

        List<AuditLogStatsDTO.ActionTypeCountDTO> byActionType = auditLogRepository
                .countByActionTypeGrouped(from, to).stream()
                .filter(row -> row[0] != null)
                .map(row -> AuditLogStatsDTO.ActionTypeCountDTO.builder()
                        .actionType(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<AuditLogStatsDTO.EntityTypeCountDTO> byEntityType = auditLogRepository
                .countByEntityTypeGrouped(from, to).stream()
                .filter(row -> row[0] != null)
                .map(row -> AuditLogStatsDTO.EntityTypeCountDTO.builder()
                        .entityType(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<AuditLogStatsDTO.DateCountDTO> byDate = auditLogRepository
                .countByDateGrouped(from, to).stream()
                .filter(row -> row[0] != null)
                .map(row -> AuditLogStatsDTO.DateCountDTO.builder()
                        .date(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<AuditLogStatsDTO.HeatmapEntryDTO> heatmap = auditLogRepository
                .getActivityHeatmap(from, to).stream()
                .filter(row -> row[0] != null && row[1] != null && row[2] != null)
                .map(row -> AuditLogStatsDTO.HeatmapEntryDTO.builder()
                        .dayOfWeek(((Number) row[0]).intValue())
                        .hour(((Number) row[1]).intValue())
                        .count(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        Pageable topUsersLimit = PageRequest.of(0, 10);
        List<AuditLogStatsDTO.ActiveUserDTO> mostActiveUsers = auditLogRepository
                .findMostActiveUsers(from, to, topUsersLimit).stream()
                .filter(row -> row[0] != null && row[1] != null && row[2] != null)
                .map(row -> AuditLogStatsDTO.ActiveUserDTO.builder()
                        .userId(((Number) row[0]).longValue())
                        .fullName(row[1].toString())
                        .actionCount(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        return AuditLogStatsDTO.builder()
                .totalLogs(totalLogs)
                .sensitiveAccessCount(sensitiveAccessCount)
                .deleteCount(deleteCount)
                .byActionType(byActionType)
                .byEntityType(byEntityType)
                .byDate(byDate)
                .heatmap(heatmap)
                .mostActiveUsers(mostActiveUsers)
                .build();
    }

    // ===== Mapping helpers =====

    private AuditLogDTO toDTO(AuditLog entity) {
        return AuditLogDTO.builder()
                .id(entity.getId())
                .user(toUserSummary(entity.getUser()))
                .action(entity.getAction())
                .actionType(entity.getActionType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .ipAddress(entity.getIpAddress())
                .requestUrl(entity.getRequestUrl())
                .requestMethod(entity.getRequestMethod())
                .geoCountry(entity.getGeoCountry())
                .geoCity(entity.getGeoCity())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private UserSummaryDTO toUserSummary(User user) {
        if (user == null) return null;
        return UserSummaryDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    private Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Could not parse audit log JSON: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<AuditLogDetailDTO.FieldChangeDTO> computeFieldChanges(Object oldValues, Object newValues) {
        if (oldValues == null && newValues == null) return List.of();

        try {
            Map<String, Object> oldMap = oldValues != null
                    ? objectMapper.convertValue(oldValues, new TypeReference<Map<String, Object>>() {})
                    : Collections.emptyMap();
            Map<String, Object> newMap = newValues != null
                    ? objectMapper.convertValue(newValues, new TypeReference<Map<String, Object>>() {})
                    : Collections.emptyMap();

            Set<String> allKeys = new HashSet<>();
            allKeys.addAll(oldMap.keySet());
            allKeys.addAll(newMap.keySet());

            return allKeys.stream()
                    .filter(key -> !Objects.equals(oldMap.get(key), newMap.get(key)))
                    .map(key -> AuditLogDetailDTO.FieldChangeDTO.builder()
                            .fieldName(key)
                            .oldValue(oldMap.get(key))
                            .newValue(newMap.get(key))
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Could not compute field changes for audit log", e);
            return List.of();
        }
    }

    private Pageable createPageable(AuditLogFilterDTO filter) {
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 20,
                Sort.by(direction, sortBy)
        );
    }

    private LocalDateTime resolveFrom(String period) {
        if (period == null) period = "7d";
        return switch (period.toLowerCase()) {
            case "24h", "1d" -> LocalDateTime.now().minusDays(1);
            case "7d" -> LocalDateTime.now().minusDays(7);
            case "30d" -> LocalDateTime.now().minusDays(30);
            case "90d" -> LocalDateTime.now().minusDays(90);
            default -> LocalDateTime.now().minusDays(7);
        };
    }
}
