package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.ActivityLogRepository;
import com.q2k.meditech.specification.ActivityLogSpecification;
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
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of ActivityLogService (10.4 Activity Logs).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Override
    public Page<ActivityLogDTO> getActivityLogs(ActivityLogFilterDTO filter) {
        log.debug("Fetching activity logs with filter: {}", filter);

        Specification<ActivityLog> spec = ActivityLogSpecification.withFilters(
                filter.getSearch(),
                filter.getActivityTypes(),
                filter.getUserId(),
                filter.getRoleName(),
                filter.getIpAddress(),
                filter.getFrom(),
                filter.getTo()
        );

        Pageable pageable = createPageable(filter);
        return activityLogRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    public ActivityLogDTO getActivityLogById(Long id) {
        log.debug("Fetching activity log by id: {}", id);
        ActivityLog activityLog = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity log not found with id: " + id));
        return toDTO(activityLog);
    }

    @Override
    public ActivityLogStatsDTO getActivityLogStats(String period) {
        log.debug("Getting activity log stats for period: {}", period);
        LocalDateTime from = resolveFrom(period);
        LocalDateTime to = LocalDateTime.now();

        long totalActivities = activityLogRepository.countSince(from);

        List<ActivityLogStatsDTO.ActivityTypeCountDTO> byActivityType = activityLogRepository
                .countByActivityType(from, to).stream()
                .filter(row -> row[0] != null)
                .map(row -> ActivityLogStatsDTO.ActivityTypeCountDTO.builder()
                        .activityType(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        // Activity logs don't have a dedicated countByDateGrouped, use timeline
        // For now, let byDate be empty or use a similar approach
        List<ActivityLogStatsDTO.DateCountDTO> byDate = List.of();

        Pageable topUsersLimit = PageRequest.of(0, 10);
        List<ActivityLogStatsDTO.ActiveUserDTO> mostActiveUsers = activityLogRepository
                .findMostActiveUsers(from, to, topUsersLimit).stream()
                .filter(row -> row[0] != null && row[1] != null && row[2] != null)
                .map(row -> ActivityLogStatsDTO.ActiveUserDTO.builder()
                        .userId(((Number) row[0]).longValue())
                        .fullName(row[1].toString())
                        .activityCount(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        return ActivityLogStatsDTO.builder()
                .totalActivities(totalActivities)
                .byActivityType(byActivityType)
                .byDate(byDate)
                .mostActiveUsers(mostActiveUsers)
                .build();
    }

    // ===== Mapping helpers =====

    private ActivityLogDTO toDTO(ActivityLog entity) {
        return ActivityLogDTO.builder()
                .id(entity.getId())
                .user(toUserSummary(entity.getUser()))
                .activityType(entity.getActivityType())
                .description(entity.getDescription())
                .resourceType(entity.getResourceType())
                .resourceId(entity.getResourceId())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .geoCountry(entity.getGeoCountry())
                .geoCity(entity.getGeoCity())
                .metadata(entity.getMetadata())
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

    private Pageable createPageable(ActivityLogFilterDTO filter) {
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
