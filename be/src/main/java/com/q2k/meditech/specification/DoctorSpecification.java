package com.q2k.meditech.specification;

import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Specialty;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class DoctorSpecification {

    public static Specification<Doctor> hasQuery(String query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (query == null || query.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            String likePattern = "%" + query.toLowerCase() + "%";
            return criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), likePattern),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("bio")), likePattern),
                criteriaBuilder.like(criteriaBuilder.lower(root.get("education")), likePattern)
            );
        };
    }

    public static Specification<Doctor> hasSpecialty(Integer specialtyId) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (specialtyId == null) {
                return criteriaBuilder.conjunction();
            }
            // Add distinct to avoid duplicates when joining with specialties
            if (criteriaQuery != null) {
                criteriaQuery.distinct(true);
            }
            Join<Doctor, Specialty> specialtiesJoin = root.join("specialties", JoinType.INNER);
            return criteriaBuilder.equal(specialtiesJoin.get("id"), specialtyId);
        };
    }

    public static Specification<Doctor> hasCity(String city) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (city == null || city.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            String likePattern = "%" + city.toLowerCase() + "%";
            return criteriaBuilder.like(criteriaBuilder.lower(root.get("officeAddress")), likePattern);
        };
    }

    public static Specification<Doctor> hasFeeInRange(BigDecimal minFee, BigDecimal maxFee) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            if (minFee == null && maxFee == null) {
                return criteriaBuilder.conjunction();
            }
            if (minFee != null && maxFee != null) {
                return criteriaBuilder.between(root.get("consultationFee"), minFee, maxFee);
            }
            if (minFee != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("consultationFee"), minFee);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("consultationFee"), maxFee);
        };
    }

    public static Specification<Doctor> isApproved() {
        // Backward compat: VERIFIED should be treated as APPROVED for public discovery.
        return (root, criteriaQuery, criteriaBuilder) ->
            root.get("verificationStatus").in("VERIFIED", "APPROVED");
    }

    /**
     * Doctor is visible for public discovery (must still be a DOCTOR account).
     */
    public static Specification<Doctor> isPublicVisible() {
        return (root, criteriaQuery, cb) -> {
            if (criteriaQuery != null) {
                criteriaQuery.distinct(true);
            }

            // Doctor must be available
            Predicate isAvailable = cb.isTrue(root.get("isAvailable"));

            // User must be active and still have DOCTOR role
            Join<Object, Object> userJoin = root.join("user", JoinType.INNER);
            Predicate userActive = cb.isTrue(userJoin.get("isActive"));

            Join<Object, Object> userRolesJoin = userJoin.join("userRoles", JoinType.INNER);
            Join<Object, Object> roleJoin = userRolesJoin.join("role", JoinType.INNER);
            Predicate hasDoctorRole = cb.equal(cb.lower(roleJoin.get("name")), "doctor");

            return cb.and(isAvailable, userActive, hasDoctorRole);
        };
    }
}
