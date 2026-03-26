package com.q2k.meditech.service;

import com.q2k.meditech.dto.InventoryAuditStatsDTO;
import com.q2k.meditech.dto.InventoryLogDTO;
import com.q2k.meditech.entity.MedicationInventoryLog;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicationInventoryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InventoryAuditLogServiceImpl implements InventoryAuditLogService {

    private final MedicationInventoryLogRepository logRepository;

    @Override
    public Page<InventoryLogDTO> getAuditLogs(
            Long medicationId, String action, String referenceType, Long userId,
            String from, String to, String search,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = "ASC".equalsIgnoreCase(sortDir)
                ? Sort.by(resolveSortField(sortBy)).ascending()
                : Sort.by(resolveSortField(sortBy)).descending();

        Specification<MedicationInventoryLog> spec = buildSpecification(
                medicationId, action, referenceType, userId, from, to, search);

        return logRepository.findAll(spec, PageRequest.of(page, size, sort))
                .map(this::toDTO);
    }

    @Override
    public InventoryLogDTO getAuditLogDetail(Long id) {
        MedicationInventoryLog logEntry = logRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryAuditLog", "id", id));
        return toDTO(logEntry);
    }

    @Override
    public InventoryAuditStatsDTO getAuditStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.toLocalDate().minusDays(now.getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        long totalLogs = logRepository.count();
        long logsToday = logRepository.countSince(startOfDay);
        long logsThisWeek = logRepository.countSince(startOfWeek);
        long logsThisMonth = logRepository.countSince(startOfMonth);

        // Count by action type (last 30 days)
        List<Object[]> typeCounts = logRepository.countByTypeSince(now.minusDays(30));
        Map<String, Long> countByAction = new LinkedHashMap<>();
        for (Object[] row : typeCounts) {
            countByAction.put((String) row[0], (Long) row[1]);
        }

        List<String> availableActions = logRepository.findDistinctTypes();
        List<String> availableReferenceTypes = logRepository.findDistinctReferenceTypes();

        return InventoryAuditStatsDTO.builder()
                .totalLogs(totalLogs)
                .logsToday(logsToday)
                .logsThisWeek(logsThisWeek)
                .logsThisMonth(logsThisMonth)
                .countByAction(countByAction)
                .availableActions(availableActions)
                .availableReferenceTypes(availableReferenceTypes)
                .build();
    }

    // ─────────── Specification Builder ───────────

    private Specification<MedicationInventoryLog> buildSpecification(
            Long medicationId, String action, String referenceType, Long userId,
            String from, String to, String search) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (medicationId != null) {
                predicates.add(cb.equal(root.get("medication").get("id"), medicationId));
            }
            if (StringUtils.hasText(action)) {
                predicates.add(cb.equal(root.get("type"), action));
            }
            if (StringUtils.hasText(referenceType)) {
                predicates.add(cb.equal(root.get("referenceType"), referenceType));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (StringUtils.hasText(from)) {
                LocalDateTime fromDate = LocalDate.parse(from, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("changedAt"), fromDate));
            }
            if (StringUtils.hasText(to)) {
                LocalDateTime toDate = LocalDate.parse(to, DateTimeFormatter.ISO_LOCAL_DATE).atTime(LocalTime.MAX);
                predicates.add(cb.lessThanOrEqualTo(root.get("changedAt"), toDate));
            }
            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("medication").get("name")), pattern),
                        cb.like(cb.lower(root.get("medication").get("code")), pattern),
                        cb.like(cb.lower(root.get("note")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ─────────── Mapping ───────────

    private InventoryLogDTO toDTO(MedicationInventoryLog logEntry) {
        InventoryLogDTO.InventoryLogDTOBuilder builder = InventoryLogDTO.builder()
                .id(logEntry.getId())
                .medicationId(logEntry.getMedication().getId())
                .medicationName(logEntry.getMedication().getName())
                .medicationCode(logEntry.getMedication().getCode())
                .type(logEntry.getType())
                .quantityBefore(logEntry.getQuantityBefore())
                .quantityAfter(logEntry.getQuantityAfter())
                .delta(logEntry.getDelta())
                .note(logEntry.getNote())
                .changedAt(logEntry.getChangedAt())
                .referenceType(logEntry.getReferenceType())
                .referenceId(logEntry.getReferenceId())
                .ipAddress(logEntry.getIpAddress())
                .userAgent(logEntry.getUserAgent());

        if (logEntry.getUser() != null) {
            builder.userId(logEntry.getUser().getId());
            builder.userName(logEntry.getUser().getFullName());
        }

        return builder.build();
    }

    private String resolveSortField(String sortBy) {
        return switch (sortBy == null ? "" : sortBy) {
            case "medication" -> "medication.name";
            case "type", "action" -> "type";
            case "delta" -> "delta";
            case "referenceType" -> "referenceType";
            default -> "changedAt";
        };
    }
}
