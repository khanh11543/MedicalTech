package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.UserConsentMapper;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserConsentRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.ConsentManagementService;
import com.q2k.meditech.service.EmailService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConsentManagementServiceImpl implements ConsentManagementService {

    private final UserConsentRepository consentRepository;
    private final UserRepository userRepository;
    private final UserConsentMapper mapper;
    private final EmailService emailService;

    // ==================== 1. GET CONSENT STATISTICS ====================
    @Override
    @Transactional(readOnly = true)
    public ConsentStatsDTO getConsentStatistics(LocalDate from, LocalDate to) {
        log.info("Fetching consent statistics from {} to {}", from, to);

        long totalConsents = consentRepository.count();
        long acceptedCount = consentRepository.countByStatus(ConsentStatus.ACCEPTED);
        long declinedCount = consentRepository.countByStatus(ConsentStatus.DECLINED);
        long revokedCount = consentRepository.countByStatus(ConsentStatus.REVOKED);
        long totalUsers = consentRepository.countDistinctUsers();

        double acceptanceRate = totalConsents > 0
                ? (double) acceptedCount / totalConsents * 100.0
                : 0.0;

        // Recent activity (last 30 days by default)
        LocalDateTime since = (from != null ? from : LocalDate.now().minusDays(30))
                .atStartOfDay();

        long recentConsentsCount = consentRepository.countRecentConsents(since);
        long recentRevocationsCount = consentRepository.countRecentRevocations(since);

        // Consents by type
        List<Object[]> consentsByTypeRaw = consentRepository.countActiveConsentsByType();
        Map<String, Long> consentsByType = new LinkedHashMap<>();
        for (Object[] row : consentsByTypeRaw) {
            consentsByType.put(row[0].toString(), (Long) row[1]);
        }

        // Users with full consent (all consent types)
        long totalConsentTypes = ConsentType.values().length;
        List<Long> fullConsentUsers = consentRepository.findUsersWithFullConsent(totalConsentTypes);
        long usersWithFullConsent = fullConsentUsers.size();
        long usersWithPartialConsent = totalUsers - usersWithFullConsent;

        return ConsentStatsDTO.builder()
                .totalConsents(totalConsents)
                .acceptedCount(acceptedCount)
                .declinedCount(declinedCount)
                .revokedCount(revokedCount)
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .totalUsers(totalUsers)
                .usersWithFullConsent(usersWithFullConsent)
                .usersWithPartialConsent(usersWithPartialConsent)
                .recentConsentsCount(recentConsentsCount)
                .recentRevocationsCount(recentRevocationsCount)
                .consentsByType(consentsByType)
                .build();
    }

    // ==================== 2. LIST CONSENT RECORDS ====================
    @Override
    @Transactional(readOnly = true)
    public Page<UserConsentDTO> getConsentRecords(ConsentFilterDTO filter) {
        log.info("Fetching consent records with filter: {}", filter);

        Sort sort = Sort.by(
                "asc".equalsIgnoreCase(filter.getSortDirection()) ? Sort.Direction.ASC : Sort.Direction.DESC,
                filter.getSortBy() != null ? filter.getSortBy() : "consentDate"
        );
        Pageable pageable = PageRequest.of(
                filter.getPage() != null ? filter.getPage() : 0,
                filter.getSize() != null ? filter.getSize() : 10,
                sort
        );

        Specification<UserConsent> spec = buildSpecification(filter);
        Page<UserConsent> page = consentRepository.findAll(spec, pageable);

        return page.map(mapper::toDTO);
    }

    // ==================== 3. GET USER CONSENT DETAIL ====================
    @Override
    @Transactional(readOnly = true)
    public UserConsentDetailDTO getUserConsentDetail(Long userId) {
        log.info("Fetching consent detail for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<UserConsent> consents = consentRepository.findByUserIdWithUser(userId);

        // Count by status
        int activeConsents = 0;
        int revokedConsents = 0;
        int declinedConsents = 0;
        for (UserConsent consent : consents) {
            switch (consent.getStatus()) {
                case ACCEPTED -> activeConsents++;
                case REVOKED -> revokedConsents++;
                case DECLINED -> declinedConsents++;
            }
        }

        // Group by type
        Map<String, List<UserConsentDTO>> consentsByType = consents.stream()
                .map(mapper::toDTO)
                .collect(Collectors.groupingBy(
                        dto -> dto.getConsentType().name(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Latest consent per type
        Map<ConsentType, UserConsent> latestByType = new LinkedHashMap<>();
        for (UserConsent consent : consents) {
            latestByType.merge(consent.getConsentType(), consent,
                    (existing, newOne) -> newOne.getConsentDate().isAfter(existing.getConsentDate()) ? newOne : existing);
        }
        List<UserConsentDTO> latestConsents = latestByType.values().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        return UserConsentDetailDTO.builder()
                .userId(user.getId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .userRole(user.getUserRoles() != null && !user.getUserRoles().isEmpty()
                        ? user.getUserRoles().stream().findFirst().map(ur -> ur.getRole().getName()).orElse(null)
                        : null)
                .accountCreatedDate(user.getCreatedAt())
                .lastLoginDate(user.getLastLogin())
                .totalConsents(consents.size())
                .activeConsents(activeConsents)
                .revokedConsents(revokedConsents)
                .declinedConsents(declinedConsents)
                .consentsByType(consentsByType)
                .latestConsents(latestConsents)
                .build();
    }

    // ==================== 4. REVOKE CONSENT ====================
    @Override
    public UserConsentDTO revokeConsent(Long id, RevokeConsentDTO dto) {
        log.info("Revoking consent: {}", id);

        UserConsent consent = consentRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent record not found with id: " + id));

        if (consent.getStatus() != ConsentStatus.ACCEPTED) {
            throw new IllegalStateException("Only accepted consents can be revoked. Current status: " + consent.getStatus());
        }

        Long adminId = SecurityUtil.getCurrentUserId();

        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevokedDate(LocalDateTime.now());
        consent.setRevokedBy(adminId);
        consent.setRevocationReason(dto.getRevocationReason());

        UserConsent saved = consentRepository.save(consent);

        // Send notification
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendRevocationNotification(saved);
        }

        log.info("Consent {} revoked by admin {}", id, adminId);
        return mapper.toDTO(saved);
    }

    // ==================== 5. EXPORT CONSENT RECORDS ====================
    @Override
    @Transactional(readOnly = true)
    public byte[] exportConsentRecords(Long userId, String consentType, LocalDate from, LocalDate to, String format) {
        log.info("Exporting consent records, format: {}", format);

        // Build filter
        ConsentFilterDTO filter = ConsentFilterDTO.builder()
                .userId(userId)
                .from(from)
                .to(to)
                .size(Integer.MAX_VALUE)
                .page(0)
                .build();

        if (consentType != null && !consentType.isBlank()) {
            try {
                filter.setConsentType(ConsentType.valueOf(consentType));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid consent type: {}", consentType);
            }
        }

        Specification<UserConsent> spec = buildSpecification(filter);
        List<UserConsent> records = consentRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "consentDate"));

        if ("EXCEL".equalsIgnoreCase(format)) {
            return generateExcelExport(records);
        }
        return generateCsvExport(records);
    }

    @Override
    public String getExportFileName(String format) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = "EXCEL".equalsIgnoreCase(format) ? "xlsx" : "csv";
        return "consent_records_" + timestamp + "." + extension;
    }

    // ==================== 6. GET CONSENT TRENDS ====================
    @Override
    @Transactional(readOnly = true)
    public ConsentTrendsDTO getConsentTrends(LocalDate from, LocalDate to, String groupBy, String consentType) {
        log.info("Fetching consent trends from {} to {}, groupBy: {}", from, to, groupBy);

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        List<UserConsent> consents;
        if (consentType != null && !consentType.isBlank()) {
            try {
                ConsentType type = ConsentType.valueOf(consentType);
                consents = consentRepository.findByConsentDateBetweenAndType(fromDateTime, toDateTime, type);
            } catch (IllegalArgumentException e) {
                consents = consentRepository.findByConsentDateBetween(fromDateTime, toDateTime);
            }
        } else {
            consents = consentRepository.findByConsentDateBetween(fromDateTime, toDateTime);
        }

        // Group by period
        Map<String, List<UserConsent>> grouped = consents.stream()
                .collect(Collectors.groupingBy(
                        c -> getPeriodKey(c.getConsentDate(), groupBy),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Fill in missing periods
        List<String> allPeriods = generatePeriodKeys(from, to, groupBy);
        List<ConsentTrendsDTO.TrendDataPoint> dataPoints = new ArrayList<>();
        long totalAccepted = 0;
        long totalDeclined = 0;
        long totalRevoked = 0;

        for (String period : allPeriods) {
            List<UserConsent> periodConsents = grouped.getOrDefault(period, Collections.emptyList());

            long accepted = periodConsents.stream().filter(c -> c.getStatus() == ConsentStatus.ACCEPTED).count();
            long declined = periodConsents.stream().filter(c -> c.getStatus() == ConsentStatus.DECLINED).count();
            long revoked = periodConsents.stream().filter(c -> c.getStatus() == ConsentStatus.REVOKED).count();

            totalAccepted += accepted;
            totalDeclined += declined;
            totalRevoked += revoked;

            dataPoints.add(ConsentTrendsDTO.TrendDataPoint.builder()
                    .period(period)
                    .accepted(accepted)
                    .declined(declined)
                    .revoked(revoked)
                    .total((long) periodConsents.size())
                    .build());
        }

        return ConsentTrendsDTO.builder()
                .dataPoints(dataPoints)
                .groupBy(groupBy)
                .consentType(consentType)
                .totalAccepted(totalAccepted)
                .totalDeclined(totalDeclined)
                .totalRevoked(totalRevoked)
                .build();
    }

    // ==================== Private Helpers ====================

    private Specification<UserConsent> buildSpecification(ConsentFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), filter.getUserId()));
            }

            if (filter.getConsentType() != null) {
                predicates.add(cb.equal(root.get("consentType"), filter.getConsentType()));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("consentDate"),
                        filter.getFrom().atStartOfDay()));
            }

            if (filter.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("consentDate"),
                        filter.getTo().atTime(LocalTime.MAX)));
            }

            // Fetch user eagerly for non-count queries
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("user", jakarta.persistence.criteria.JoinType.LEFT);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private byte[] generateCsvExport(List<UserConsent> records) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8);

        // BOM for UTF-8
        writer.print('\uFEFF');

        // Header
        writer.println("ID,User ID,User Name,User Email,Consent Type,Status,Consent Date,Version,IP Address,Revoked Date,Revoked By,Revocation Reason");

        // Data rows
        for (UserConsent record : records) {
            User user = record.getUser();
            writer.printf("%d,%d,\"%s\",\"%s\",%s,%s,%s,\"%s\",\"%s\",%s,%s,\"%s\"%n",
                    record.getId(),
                    user != null ? user.getId() : 0,
                    user != null ? escapeCsv(user.getFullName()) : "",
                    user != null ? escapeCsv(user.getEmail()) : "",
                    record.getConsentType(),
                    record.getStatus(),
                    record.getConsentDate() != null ? record.getConsentDate().toString() : "",
                    record.getVersion() != null ? escapeCsv(record.getVersion()) : "",
                    record.getIpAddress() != null ? escapeCsv(record.getIpAddress()) : "",
                    record.getRevokedDate() != null ? record.getRevokedDate().toString() : "",
                    record.getRevokedBy() != null ? record.getRevokedBy() : "",
                    record.getRevocationReason() != null ? escapeCsv(record.getRevocationReason()) : ""
            );
        }

        writer.flush();
        return baos.toByteArray();
    }

    private byte[] generateExcelExport(List<UserConsent> records) {
        // Simplified: generate CSV with .xlsx extension (real XSLX would need Apache POI)
        // For now, produce a tab-separated format compatible with Excel
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8);

        writer.print('\uFEFF');
        writer.println("ID\tUser ID\tUser Name\tUser Email\tConsent Type\tStatus\tConsent Date\tVersion\tIP Address\tRevoked Date\tRevoked By\tRevocation Reason");

        for (UserConsent record : records) {
            User user = record.getUser();
            writer.printf("%d\t%d\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s%n",
                    record.getId(),
                    user != null ? user.getId() : 0,
                    user != null ? user.getFullName() : "",
                    user != null ? user.getEmail() : "",
                    record.getConsentType(),
                    record.getStatus(),
                    record.getConsentDate() != null ? record.getConsentDate().toString() : "",
                    record.getVersion() != null ? record.getVersion() : "",
                    record.getIpAddress() != null ? record.getIpAddress() : "",
                    record.getRevokedDate() != null ? record.getRevokedDate().toString() : "",
                    record.getRevokedBy() != null ? record.getRevokedBy() : "",
                    record.getRevocationReason() != null ? record.getRevocationReason() : ""
            );
        }

        writer.flush();
        return baos.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }

    private String getPeriodKey(LocalDateTime dateTime, String groupBy) {
        if ("DAY".equalsIgnoreCase(groupBy)) {
            return dateTime.toLocalDate().toString();
        } else if ("WEEK".equalsIgnoreCase(groupBy)) {
            int weekOfYear = dateTime.get(WeekFields.ISO.weekOfWeekBasedYear());
            int year = dateTime.getYear();
            return year + "-W" + String.format("%02d", weekOfYear);
        } else {
            // MONTH (default)
            return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }
    }

    private List<String> generatePeriodKeys(LocalDate from, LocalDate to, String groupBy) {
        List<String> keys = new LinkedList<>();

        if ("DAY".equalsIgnoreCase(groupBy)) {
            LocalDate current = from;
            while (!current.isAfter(to)) {
                keys.add(current.toString());
                current = current.plusDays(1);
            }
        } else if ("WEEK".equalsIgnoreCase(groupBy)) {
            LocalDate current = from;
            while (!current.isAfter(to)) {
                int weekOfYear = current.get(WeekFields.ISO.weekOfWeekBasedYear());
                String key = current.getYear() + "-W" + String.format("%02d", weekOfYear);
                if (keys.isEmpty() || !keys.get(keys.size() - 1).equals(key)) {
                    keys.add(key);
                }
                current = current.plusDays(1);
            }
        } else {
            // MONTH
            LocalDate current = from.withDayOfMonth(1);
            while (!current.isAfter(to)) {
                keys.add(current.format(DateTimeFormatter.ofPattern("yyyy-MM")));
                current = current.plusMonths(1);
            }
        }

        return keys;
    }

    private void sendRevocationNotification(UserConsent consent) {
        try {
            User user = consent.getUser();
            String subject = "Your Consent Has Been Revoked";
            String content = "<html><body>"
                    + "<h2>Consent Revocation Notice</h2>"
                    + "<p>Dear " + user.getFullName() + ",</p>"
                    + "<p>Your consent for <strong>" + consent.getConsentType().name().replace("_", " ") + "</strong> has been revoked.</p>"
                    + "<p><strong>Reason:</strong> " + (consent.getRevocationReason() != null ? consent.getRevocationReason() : "N/A") + "</p>"
                    + "<p>If you did not request this, please contact our support team immediately.</p>"
                    + "<p>Best regards,<br>MediTech Team</p>"
                    + "</body></html>";

            emailService.sendHtmlEmail(user.getEmail(), subject, content);
            consent.setNotificationSent(true);
            consent.setNotificationSentDate(LocalDateTime.now());
            consentRepository.save(consent);

        } catch (Exception e) {
            log.warn("Failed to send revocation notification for consent {}: {}", consent.getId(), e.getMessage());
        }
    }
}
