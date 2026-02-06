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
        return (root, criteriaQuery, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("verificationStatus"), "APPROVED");
    }
}
