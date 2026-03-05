package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SecurityEventRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.specification.SecurityEventSpecification;
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
 * Implementation of SecurityEventService (10.1 Security Events).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SecurityEventServiceImpl implements SecurityEventService {

    private final SecurityEventRepository securityEventRepository;
    private final UserRepository userRepository;

    // ===== Query methods =====

    @Override
    @Transactional(readOnly = true)
    public Page<SecurityEventDTO> getSecurityEvents(SecurityEventFilterDTO filter) {
        log.debug("Fetching security events with filter: {}", filter);

        Specification<SecurityEvent> spec = SecurityEventSpecification.withFilters(
                filter.getSearch(),
                filter.getEventTypes(),
                filter.getSeverities(),
                filter.getStatus(),
                filter.getUserId(),
                filter.getIpAddress(),
                filter.getFrom(),
                filter.getTo()
        );

        Pageable pageable = createPageable(filter);
        return securityEventRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public SecurityEventDTO getSecurityEventById(Long id) {
        log.debug("Fetching security event by id: {}", id);
        SecurityEvent event = securityEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Security event not found with id: " + id));
        return toDTO(event);
    }

    // ===== Mutation methods =====

    @Override
    public SecurityEventDTO reviewSecurityEvent(Long id, Long reviewerId) {
        log.info("Reviewing security event id={} by reviewer={}", id, reviewerId);
        SecurityEvent event = securityEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Security event not found with id: " + id));

        if (event.getStatus() != SecurityEventStatus.NEW) {
            throw new BadRequestException("Only NEW events can be reviewed. Current status: " + event.getStatus());
        }

        event.setStatus(SecurityEventStatus.REVIEWED);
        SecurityEvent saved = securityEventRepository.save(event);
        return toDTO(saved);
    }

    @Override
    public SecurityEventDTO resolveSecurityEvent(Long id, Long resolverId, String resolutionNote) {
        log.info("Resolving security event id={} by resolver={}", id, resolverId);
        SecurityEvent event = securityEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Security event not found with id: " + id));

        if (event.getStatus() == SecurityEventStatus.RESOLVED) {
            throw new BadRequestException("Event is already resolved");
        }

        User resolver = userRepository.findById(resolverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + resolverId));

        event.setStatus(SecurityEventStatus.RESOLVED);
        event.setResolvedAt(LocalDateTime.now());
        event.setResolvedBy(resolver);
        // Store resolution note in metadata if desired
        if (resolutionNote != null && !resolutionNote.isBlank()) {
            event.setDescription(
                    (event.getDescription() != null ? event.getDescription() + "\n" : "")
                    + "[Resolution] " + resolutionNote
            );
        }

        SecurityEvent saved = securityEventRepository.save(event);
        return toDTO(saved);
    }

    // ===== Statistics =====

    @Override
    @Transactional(readOnly = true)
    public SecurityEventStatsDTO getSecurityEventStats(String period) {
        log.debug("Getting security event stats for period: {}", period);
        LocalDateTime from = resolveFrom(period);
        LocalDateTime to = LocalDateTime.now();

        long totalEvents = securityEventRepository.countSince(from);
        long highCount = securityEventRepository.countBySeverityAndCreatedAtAfter(
                com.q2k.meditech.entity.enums.SecuritySeverity.HIGH, from);
        long mediumCount = securityEventRepository.countBySeverityAndCreatedAtAfter(
                com.q2k.meditech.entity.enums.SecuritySeverity.MEDIUM, from);
        long lowCount = securityEventRepository.countBySeverityAndCreatedAtAfter(
                com.q2k.meditech.entity.enums.SecuritySeverity.LOW, from);

        long newCount = securityEventRepository.countByStatusAndCreatedAtAfter(
                SecurityEventStatus.NEW, from);
        long reviewedCount = securityEventRepository.countByStatusAndCreatedAtAfter(
                SecurityEventStatus.REVIEWED, from);
        long resolvedCount = securityEventRepository.countByStatusAndCreatedAtAfter(
                SecurityEventStatus.RESOLVED, from);

        // Aggregation breakdowns
        List<SecurityEventStatsDTO.TypeCountDTO> byType = securityEventRepository
                .countByEventTypeGrouped(from, to).stream()
                .map(row -> SecurityEventStatsDTO.TypeCountDTO.builder()
                        .eventType(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<SecurityEventStatsDTO.SeverityCountDTO> bySeverity = securityEventRepository
                .countBySeverityGrouped(from).stream()
                .map(row -> SecurityEventStatsDTO.SeverityCountDTO.builder()
                        .severity(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<SecurityEventStatsDTO.DateCountDTO> byDate = securityEventRepository
                .countByDateGrouped(from, to).stream()
                .map(row -> SecurityEventStatsDTO.DateCountDTO.builder()
                        .date(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return SecurityEventStatsDTO.builder()
                .totalEvents(totalEvents)
                .highSeverityCount(highCount)
                .mediumSeverityCount(mediumCount)
                .lowSeverityCount(lowCount)
                .newCount(newCount)
                .reviewedCount(reviewedCount)
                .resolvedCount(resolvedCount)
                .byEventType(byType)
                .bySeverity(bySeverity)
                .byDate(byDate)
                .build();
    }

    // ===== Mapping helpers =====

    private SecurityEventDTO toDTO(SecurityEvent event) {
        return SecurityEventDTO.builder()
                .id(event.getId())
                .user(toUserSummary(event.getUser()))
                .eventType(event.getEventType())
                .severity(event.getSeverity())
                .status(event.getStatus())
                .ipAddress(event.getIpAddress())
                .userAgent(event.getUserAgent())
                .description(event.getDescription())
                .requestUrl(event.getRequestUrl())
                .requestMethod(event.getRequestMethod())
                .requestHeaders(event.getRequestHeaders())
                .geoCountry(event.getGeoCountry())
                .geoCity(event.getGeoCity())
                .isp(event.getIsp())
                .metadata(event.getMetadata())
                .createdAt(event.getCreatedAt())
                .resolvedAt(event.getResolvedAt())
                .resolvedBy(toUserSummary(event.getResolvedBy()))
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

    private Pageable createPageable(SecurityEventFilterDTO filter) {
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
