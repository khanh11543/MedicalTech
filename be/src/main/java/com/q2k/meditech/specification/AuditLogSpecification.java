package com.q2k.meditech.specification;

import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.enums.AuditActionType;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic filtering of AuditLog entities.
 * Supports search, action type, entity type, date range, IP, and user filtering.
 */
public class AuditLogSpecification {

    /**
     * Composite filter combining all criteria.
     */
    public static Specification<AuditLog> withFilters(
            String search,
            List<AuditActionType> actionTypes,
            List<String> entityTypes,
            Long userId,
            String ipAddress,
            Long entityId,
            LocalDateTime from,
            LocalDateTime to) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search: user name/email, entity ID, old/new values, action string
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                var userJoin = root.join("user", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(userJoin.get("fullName")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern),
                        cb.like(cb.lower(root.get("action")), pattern),
                        cb.like(cb.lower(root.get("entityType")), pattern),
                        cb.like(cb.lower(root.get("ipAddress")), pattern)
                ));
            }

            // Multi-select action types
            if (actionTypes != null && !actionTypes.isEmpty()) {
                predicates.add(root.get("actionType").in(actionTypes));
            }

            // Multi-select entity types
            if (entityTypes != null && !entityTypes.isEmpty()) {
                predicates.add(root.get("entityType").in(entityTypes));
            }

            // User filter
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            // Entity ID filter
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
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

    public static Specification<AuditLog> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase().trim() + "%";
            var userJoin = root.join("user", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(userJoin.get("fullName")), pattern),
                    cb.like(cb.lower(userJoin.get("email")), pattern),
                    cb.like(cb.lower(root.get("action")), pattern),
                    cb.like(cb.lower(root.get("entityType")), pattern),
                    cb.like(cb.lower(root.get("ipAddress")), pattern)
            );
        };
    }

    public static Specification<AuditLog> hasActionTypes(List<AuditActionType> actionTypes) {
        return (root, query, cb) -> {
            if (actionTypes == null || actionTypes.isEmpty()) return cb.conjunction();
            return root.get("actionType").in(actionTypes);
        };
    }

    public static Specification<AuditLog> hasEntityTypes(List<String> entityTypes) {
        return (root, query, cb) -> {
            if (entityTypes == null || entityTypes.isEmpty()) return cb.conjunction();
            return root.get("entityType").in(entityTypes);
        };
    }

    public static Specification<AuditLog> hasUserId(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get("user").get("id"), userId);
        };
    }

    public static Specification<AuditLog> hasEntityId(Long entityId) {
        return (root, query, cb) -> {
            if (entityId == null) return cb.conjunction();
            return cb.equal(root.get("entityId"), entityId);
        };
    }

    public static Specification<AuditLog> hasIpAddress(String ipAddress) {
        return (root, query, cb) -> {
            if (ipAddress == null || ipAddress.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("ipAddress"), ipAddress.trim());
        };
    }

    public static Specification<AuditLog> createdBetween(LocalDateTime from, LocalDateTime to) {
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

    public static Specification<AuditLog> hasActionType(AuditActionType actionType) {
        return (root, query, cb) -> {
            if (actionType == null) return cb.conjunction();
            return cb.equal(root.get("actionType"), actionType);
        };
    }

    public static Specification<AuditLog> hasEntityType(String entityType) {
        return (root, query, cb) -> {
            if (entityType == null || entityType.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("entityType"), entityType.trim());
        };
    }
}
