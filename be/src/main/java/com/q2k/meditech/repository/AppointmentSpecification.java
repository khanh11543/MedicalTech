package com.q2k.meditech.repository;

import com.q2k.meditech.dto.AppointmentFilterDTO;
import com.q2k.meditech.entity.Appointment;
import jakarta.persistence.criteria.Predicate;
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
            
            // Filter by status
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
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
            
            // Add default ordering
            query.orderBy(
                criteriaBuilder.asc(root.get("appointmentDate")),
                criteriaBuilder.asc(root.get("startTime"))
            );
            
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