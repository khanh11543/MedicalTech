package com.q2k.meditech.specification;

import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic filtering of SecurityEvent entities.
 * Supports search, multi-select enums, date range, IP address, and user filtering.
 */
public class SecurityEventSpecification {

    /**
     * Composite filter combining all criteria.
     */
    public static Specification<SecurityEvent> withFilters(
            String search,
            List<SecurityEventType> eventTypes,
            List<SecuritySeverity> severities,
            SecurityEventStatus status,
            Long userId,
            String ipAddress,
            LocalDateTime from,
            LocalDateTime to) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search: user name/email, IP, description, request URL
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                var userJoin = root.join("user", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(userJoin.get("fullName")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern),
                        cb.like(cb.lower(root.get("ipAddress")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("requestUrl")), pattern)
                ));
            }

            // Multi-select event types
            if (eventTypes != null && !eventTypes.isEmpty()) {
                predicates.add(root.get("eventType").in(eventTypes));
            }

            // Multi-select severities
            if (severities != null && !severities.isEmpty()) {
                predicates.add(root.get("severity").in(severities));
            }

            // Single status filter
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // User filter
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            // IP address exact match
            if (ipAddress != null && !ipAddress.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("ipAddress"), ipAddress.trim()));
            }

            // Date range
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ===== Individual composable specifications =====

    public static Specification<SecurityEvent> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase().trim() + "%";
            var userJoin = root.join("user", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(userJoin.get("fullName")), pattern),
                    cb.like(cb.lower(userJoin.get("email")), pattern),
                    cb.like(cb.lower(root.get("ipAddress")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("requestUrl")), pattern)
            );
        };
    }

    public static Specification<SecurityEvent> hasEventTypes(List<SecurityEventType> eventTypes) {
        return (root, query, cb) -> {
            if (eventTypes == null || eventTypes.isEmpty()) return cb.conjunction();
            return root.get("eventType").in(eventTypes);
        };
    }

    public static Specification<SecurityEvent> hasSeverities(List<SecuritySeverity> severities) {
        return (root, query, cb) -> {
            if (severities == null || severities.isEmpty()) return cb.conjunction();
            return root.get("severity").in(severities);
        };
    }

    public static Specification<SecurityEvent> hasStatus(SecurityEventStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<SecurityEvent> hasUserId(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get("user").get("id"), userId);
        };
    }

    public static Specification<SecurityEvent> hasIpAddress(String ipAddress) {
        return (root, query, cb) -> {
            if (ipAddress == null || ipAddress.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("ipAddress"), ipAddress.trim());
        };
    }

    public static Specification<SecurityEvent> createdBetween(LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<SecurityEvent> hasSeverity(SecuritySeverity severity) {
        return (root, query, cb) -> {
            if (severity == null) return cb.conjunction();
            return cb.equal(root.get("severity"), severity);
        };
    }

    public static Specification<SecurityEvent> hasGeoCountry(String country) {
        return (root, query, cb) -> {
            if (country == null || country.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("geoCountry"), country.trim());
        };
    }
}
