package com.q2k.meditech.repository;

import com.q2k.meditech.dto.AppointmentFilterDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Payment;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AppointmentSpecification {
    
    public static Specification<Appointment> withFilter(AppointmentFilterDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by doctor
            if (filter.getDoctorId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("id"), filter.getDoctorId()));
            }
            
            // Filter by patient
            if (filter.getPatientId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("patient").get("id"), filter.getPatientId()));
            }
            
            // Filter by single status
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }
            
            // Filter by multiple statuses
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
            }
            
            // Filter by specific date
            if (filter.getDate() != null) {
                predicates.add(criteriaBuilder.equal(root.get("appointmentDate"), filter.getDate()));
            }
            
            // Filter by date range
            if (filter.getFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("appointmentDate"), filter.getFrom()));
            }
            
            if (filter.getTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("appointmentDate"), filter.getTo()));
            }
            
            // Search by patient name, doctor name, email, phone, appointment code, or ID
            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchTerm = filter.getSearch().trim();
                String searchPattern = "%" + searchTerm.toLowerCase() + "%";
                
                Join<Object, Object> patientJoin = root.join("patient", JoinType.LEFT);
                Join<Object, Object> patientUserJoin = patientJoin.join("user", JoinType.LEFT);
                Join<Object, Object> doctorJoin = root.join("doctor", JoinType.LEFT);
                Join<Object, Object> doctorUserJoin = doctorJoin.join("user", JoinType.LEFT);
                
                List<Predicate> searchPredicates = new ArrayList<>();
                
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(patientUserJoin.get("fullName")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(doctorUserJoin.get("fullName")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("appointmentCode")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(patientUserJoin.get("phone")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(patientUserJoin.get("email")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(doctorUserJoin.get("email")), searchPattern));
                
                // Search by appointment ID (numeric)
                try {
                    Long searchId = Long.parseLong(searchTerm);
                    searchPredicates.add(criteriaBuilder.equal(root.get("id"), searchId));
                } catch (NumberFormatException ignored) {
                    // not a number — skip ID search
                }
                
                predicates.add(criteriaBuilder.or(
                        searchPredicates.toArray(new Predicate[0])));
            }
            
            // Filter by appointment type
            if (filter.getAppointmentType() != null && !filter.getAppointmentType().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("appointmentType"), filter.getAppointmentType()));
            }
            
            // Filter by payment status (join with payments table via subquery)
            if (filter.getPaymentStatus() != null && !filter.getPaymentStatus().isEmpty()) {
                String ps = filter.getPaymentStatus().toUpperCase();
                if ("PENDING".equals(ps)) {
                    // PENDING = no payment record OR payment with PENDING status
                    Subquery<Long> paidSubquery = query.subquery(Long.class);
                    Root<Payment> paymentRoot = paidSubquery.from(Payment.class);
                    paidSubquery.select(paymentRoot.get("appointment").get("id"))
                            .where(criteriaBuilder.and(
                                    criteriaBuilder.equal(paymentRoot.get("appointment").get("id"), root.get("id")),
                                    criteriaBuilder.notEqual(criteriaBuilder.upper(paymentRoot.get("paymentStatus")), "PENDING")
                            ));
                    predicates.add(criteriaBuilder.not(criteriaBuilder.exists(paidSubquery)));
                } else {
                    // PAID, REFUNDED etc. — must have a matching payment record
                    Subquery<Long> paySubquery = query.subquery(Long.class);
                    Root<Payment> paymentRoot = paySubquery.from(Payment.class);
                    paySubquery.select(paymentRoot.get("appointment").get("id"))
                            .where(criteriaBuilder.and(
                                    criteriaBuilder.equal(paymentRoot.get("appointment").get("id"), root.get("id")),
                                    criteriaBuilder.equal(criteriaBuilder.upper(paymentRoot.get("paymentStatus")), ps)
                            ));
                    predicates.add(criteriaBuilder.exists(paySubquery));
                }
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    public static Specification<Appointment> byPatient(Long patientId) {
        return (root, query, cb) -> {
            if (patientId == null) return null;
            return cb.equal(root.get("patient").get("id"), patientId);
        };
    }
    
    public static Specification<Appointment> byDoctor(Long doctorId) {
        return (root, query, cb) -> {
            if (doctorId == null) return null;
            return cb.equal(root.get("doctor").get("id"), doctorId);
        };
    }
}