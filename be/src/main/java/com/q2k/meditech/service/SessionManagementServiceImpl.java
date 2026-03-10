package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.LoginAttempt;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserSession;
import com.q2k.meditech.entity.enums.SessionStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.LoginAttemptRepository;
import com.q2k.meditech.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of SessionManagementService (10.5 Force Logout / Session Management).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SessionManagementServiceImpl implements SessionManagementService {

    private final UserSessionRepository userSessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;

    private static final int IDLE_THRESHOLD_MINUTES = 30;

    // ===== Sessions =====

    @Override
    @Transactional(readOnly = true)
    public Page<UserSessionDTO> getSessions(SessionFilterDTO filter) {
        log.debug("Fetching sessions with filter: {}", filter);
        Pageable pageable = createSessionPageable(filter);

        Page<UserSession> page;
        if (filter.getUserId() != null) {
            page = userSessionRepository.findByUserIdOrderByLastSeenAtDesc(filter.getUserId(), pageable);
        } else if (filter.getStatus() != null) {
            page = userSessionRepository.findByStatusOrderByLastSeenAtDesc(filter.getStatus(), pageable);
        } else if (filter.getIpAddress() != null && !filter.getIpAddress().isBlank()) {
            page = userSessionRepository.findByIpAddressOrderByLastSeenAtDesc(filter.getIpAddress(), pageable);
        } else {
            page = userSessionRepository.findAll(pageable);
        }

        return page.map(this::toSessionDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSessionDTO getSessionById(Long id) {
        log.debug("Fetching session by id: {}", id);
        UserSession session = userSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + id));
        return toSessionDTO(session);
    }

    @Override
    public int forceLogout(ForceLogoutDTO dto, Long performedByUserId) {
        log.info("Force logout requested by user: {}", performedByUserId);
        LocalDateTime now = LocalDateTime.now();
        int revokedCount = 0;

        if (dto.getSessionIds() != null && !dto.getSessionIds().isEmpty()) {
            // Revoke specific sessions
            for (Long sessionId : dto.getSessionIds()) {
                UserSession session = userSessionRepository.findById(sessionId).orElse(null);
                if (session != null && session.getRevokedAt() == null) {
                    session.setRevokedAt(now);
                    session.setRevokeReason(dto.getReason());
                    session.setStatus(SessionStatus.REVOKED);
                    userSessionRepository.save(session);
                    revokedCount++;
                }
            }
            log.info("Revoked {} sessions by session IDs", revokedCount);
        } else if (dto.getUserId() != null) {
            // Revoke all sessions for a user (optionally excluding one)
            Long excludeId = dto.getExcludeSessionId() != null ? dto.getExcludeSessionId() : -1L;
            revokedCount = userSessionRepository.revokeOtherUserSessions(
                    dto.getUserId(), excludeId, now, dto.getReason());
            log.info("Revoked {} sessions for user: {}", revokedCount, dto.getUserId());
        } else if (dto.getIpAddress() != null && !dto.getIpAddress().isBlank()) {
            // Revoke all sessions from IP
            revokedCount = userSessionRepository.revokeAllSessionsByIp(
                    dto.getIpAddress(), now, dto.getReason());
            log.info("Revoked {} sessions from IP: {}", revokedCount, dto.getIpAddress());
        } else {
            throw new BadRequestException("At least one of sessionIds, userId, or ipAddress must be provided");
        }

        return revokedCount;
    }

    @Override
    @Transactional(readOnly = true)
    public SessionStatsDTO getSessionStats() {
        log.debug("Fetching session stats");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime idleThreshold = now.minusMinutes(IDLE_THRESHOLD_MINUTES);
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

        long totalActive = userSessionRepository.countTotalActiveSessions(now);
        long idleSessions = userSessionRepository.countIdleSessions(idleThreshold);

        // Revoked today — count sessions revoked since todayStart
        long revokedToday = userSessionRepository.countByStatusSince(SessionStatus.REVOKED, todayStart);

        List<SessionStatsDTO.DeviceCountDTO> byDevice = userSessionRepository
                .countActiveByDeviceType(now).stream()
                .map(row -> SessionStatsDTO.DeviceCountDTO.builder()
                        .deviceType(row[0] != null ? row[0].toString() : "Unknown")
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<SessionStatsDTO.BrowserCountDTO> byBrowser = userSessionRepository
                .countActiveByBrowser(now).stream()
                .map(row -> SessionStatsDTO.BrowserCountDTO.builder()
                        .browserName(row[0] != null ? row[0].toString() : "Unknown")
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<SessionStatsDTO.CountryCountDTO> byCountry = userSessionRepository
                .countActiveByCountry(now).stream()
                .map(row -> SessionStatsDTO.CountryCountDTO.builder()
                        .country(row[0] != null ? row[0].toString() : "Unknown")
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        LocalDateTime from = now.minusDays(30);
        List<SessionStatsDTO.DateCountDTO> sessionsByDate = userSessionRepository
                .countSessionsByDateGrouped(from, now).stream()
                .map(row -> SessionStatsDTO.DateCountDTO.builder()
                        .date(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return SessionStatsDTO.builder()
                .totalActiveSessions(totalActive)
                .idleSessions(idleSessions)
                .revokedToday(revokedToday)
                .byDeviceType(byDevice)
                .byBrowser(byBrowser)
                .byCountry(byCountry)
                .sessionsByDate(sessionsByDate)
                .build();
    }

    // ===== Login Attempts =====

    @Override
    @Transactional(readOnly = true)
    public Page<LoginAttemptDTO> getLoginAttempts(Long userId, int page, int size) {
        log.debug("Fetching login attempts for user: {}", userId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "attemptedAt"));
        Page<LoginAttempt> attempts = loginAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId, pageable);
        return attempts.map(this::toLoginAttemptDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginAttemptStatsDTO getLoginAttemptStats(String period) {
        log.debug("Getting login attempt stats for period: {}", period);
        LocalDateTime from = resolveFrom(period);
        LocalDateTime to = LocalDateTime.now();

        long totalAttempts = loginAttemptRepository.countBySuccessBetween(true, from, to)
                + loginAttemptRepository.countBySuccessBetween(false, from, to);
        long successfulAttempts = loginAttemptRepository.countBySuccessBetween(true, from, to);
        long failedAttempts = loginAttemptRepository.countBySuccessBetween(false, from, to);
        long uniqueIpsWithFailures = loginAttemptRepository.countDistinctIpBySuccessBetween(false, from, to);

        List<LoginAttemptStatsDTO.DateCountDTO> byDate = loginAttemptRepository
                .countByDateGrouped(from, to).stream()
                .map(row -> LoginAttemptStatsDTO.DateCountDTO.builder()
                        .date(row[0].toString())
                        .successCount(((Number) row[1]).longValue())
                        .failedCount(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<LoginAttemptStatsDTO.HourCountDTO> failedByHour = loginAttemptRepository
                .failedAttemptsByHourGrouped(from, to).stream()
                .map(row -> LoginAttemptStatsDTO.HourCountDTO.builder()
                        .hour(((Number) row[0]).intValue())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        Pageable topIpsLimit = PageRequest.of(0, 10);
        List<LoginAttemptStatsDTO.IpCountDTO> topFailedIps = loginAttemptRepository
                .findTopFailedIps(from, topIpsLimit).stream()
                .map(row -> LoginAttemptStatsDTO.IpCountDTO.builder()
                        .ipAddress(row[0].toString())
                        .failedCount(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<LoginAttemptStatsDTO.CountryCountDTO> byCountry = loginAttemptRepository
                .countByCountryGrouped(from, to).stream()
                .map(row -> LoginAttemptStatsDTO.CountryCountDTO.builder()
                        .country(row[0] != null ? row[0].toString() : "Unknown")
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return LoginAttemptStatsDTO.builder()
                .totalAttempts(totalAttempts)
                .successfulAttempts(successfulAttempts)
                .failedAttempts(failedAttempts)
                .uniqueIpsWithFailures(uniqueIpsWithFailures)
                .byDate(byDate)
                .failedByHour(failedByHour)
                .topFailedIps(topFailedIps)
                .byCountry(byCountry)
                .build();
    }

    // ===== Mapping helpers =====

    private UserSessionDTO toSessionDTO(UserSession entity) {
        return UserSessionDTO.builder()
                .id(entity.getId())
                .user(toUserSummary(entity.getUser()))
                .status(entity.getStatus())
                .deviceId(entity.getDeviceId())
                .deviceName(entity.getDeviceName())
                .deviceType(entity.getDeviceType())
                .browserName(entity.getBrowserName())
                .browserVersion(entity.getBrowserVersion())
                .osName(entity.getOsName())
                .ipAddress(entity.getIpAddress())
                .geoCountry(entity.getGeoCountry())
                .geoCity(entity.getGeoCity())
                .requestCount(entity.getRequestCount())
                .lastActivityDescription(entity.getLastActivityDescription())
                .createdAt(entity.getCreatedAt())
                .lastSeenAt(entity.getLastSeenAt())
                .expiresAt(entity.getExpiresAt())
                .revokedAt(entity.getRevokedAt())
                .revokeReason(entity.getRevokeReason())
                .build();
    }

    private LoginAttemptDTO toLoginAttemptDTO(LoginAttempt entity) {
        return LoginAttemptDTO.builder()
                .id(entity.getId())
                .user(toUserSummary(entity.getUser()))
                .email(entity.getEmail())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .success(entity.getSuccess())
                .failureReason(entity.getFailureReason())
                .attemptedAt(entity.getAttemptedAt())
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

    private Pageable createSessionPageable(SessionFilterDTO filter) {
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "lastSeenAt";
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
