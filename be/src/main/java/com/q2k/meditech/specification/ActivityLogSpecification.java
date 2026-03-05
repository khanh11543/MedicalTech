package com.q2k.meditech.specification;

import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.entity.enums.ActivityType;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic filtering of ActivityLog entities.
 * Supports search, activity type multi-select, user, role, and date range filtering.
 */
public class ActivityLogSpecification {

    /**
     * Composite filter combining all criteria.
     */
    public static Specification<ActivityLog> withFilters(
            String search,
            List<ActivityType> activityTypes,
            Long userId,
            String roleName,
            String ipAddress,
            LocalDateTime from,
            LocalDateTime to) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search: user name/email, description, resource type
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase().trim() + "%";
                var userJoin = root.join("user", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(userJoin.get("fullName")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("resourceType")), pattern),
                        cb.like(cb.lower(root.get("ipAddress")), pattern)
                ));
            }

            // Multi-select activity types
            if (activityTypes != null && !activityTypes.isEmpty()) {
                predicates.add(root.get("activityType").in(activityTypes));
            }

            // User filter
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            // Role filter (join through user → roles)
            if (roleName != null && !roleName.trim().isEmpty()) {
                var userJoin = root.join("user", JoinType.INNER);
                var rolesJoin = userJoin.join("roles", JoinType.INNER);
                predicates.add(cb.equal(rolesJoin.get("name"), roleName.trim()));
                if (query != null) {
                    query.distinct(true);
                }
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

    public static Specification<ActivityLog> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) return cb.conjunction();
            String pattern = "%" + search.toLowerCase().trim() + "%";
            var userJoin = root.join("user", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(userJoin.get("fullName")), pattern),
                    cb.like(cb.lower(userJoin.get("email")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("resourceType")), pattern),
                    cb.like(cb.lower(root.get("ipAddress")), pattern)
            );
        };
    }

    public static Specification<ActivityLog> hasActivityTypes(List<ActivityType> activityTypes) {
        return (root, query, cb) -> {
            if (activityTypes == null || activityTypes.isEmpty()) return cb.conjunction();
            return root.get("activityType").in(activityTypes);
        };
    }

    public static Specification<ActivityLog> hasUserId(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get("user").get("id"), userId);
        };
    }

    public static Specification<ActivityLog> hasRole(String roleName) {
        return (root, query, cb) -> {
            if (roleName == null || roleName.trim().isEmpty()) return cb.conjunction();
            var userJoin = root.join("user", JoinType.INNER);
            var rolesJoin = userJoin.join("roles", JoinType.INNER);
            if (query != null) {
                query.distinct(true);
            }
            return cb.equal(rolesJoin.get("name"), roleName.trim());
        };
    }

    public static Specification<ActivityLog> hasIpAddress(String ipAddress) {
        return (root, query, cb) -> {
            if (ipAddress == null || ipAddress.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("ipAddress"), ipAddress.trim());
        };
    }

    public static Specification<ActivityLog> createdBetween(LocalDateTime from, LocalDateTime to) {
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

    public static Specification<ActivityLog> hasResourceType(String resourceType) {
        return (root, query, cb) -> {
            if (resourceType == null || resourceType.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("resourceType"), resourceType.trim());
        };
    }

    public static Specification<ActivityLog> hasResourceId(Long resourceId) {
        return (root, query, cb) -> {
            if (resourceId == null) return cb.conjunction();
            return cb.equal(root.get("resourceId"), resourceId);
        };
    }

    public static Specification<ActivityLog> hasGeoCountry(String country) {
        return (root, query, cb) -> {
            if (country == null || country.trim().isEmpty()) return cb.conjunction();
            return cb.equal(root.get("geoCountry"), country.trim());
        };
    }
}
