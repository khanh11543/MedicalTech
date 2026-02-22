package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long>, JpaSpecificationExecutor<Prescription> {
    
    // Tìm prescription với đầy đủ thông tin
    @Query("SELECT p FROM Prescription p " +
           "JOIN FETCH p.patient pat " +
           "JOIN FETCH pat.user " +
           "JOIN FETCH p.doctor doc " +
           "JOIN FETCH doc.user " +
           "LEFT JOIN FETCH p.items " +
           "WHERE p.id = :id")
    Optional<Prescription> findByIdWithDetails(@Param("id") Long id);
    
    // Tìm theo patient
    @Query("SELECT DISTINCT p FROM Prescription p " +
           "JOIN FETCH p.patient pat " +
           "JOIN FETCH pat.user " +
           "JOIN FETCH p.doctor doc " +
           "JOIN FETCH doc.user " +
           "WHERE pat.id = :patientId " +
           "ORDER BY p.prescriptionDate DESC")
    List<Prescription> findByPatientId(@Param("patientId") Long patientId);
    
    // Tìm theo patient với pagination
    Page<Prescription> findByPatientIdOrderByPrescriptionDateDesc(Long patientId, Pageable pageable);
    
    // Tìm theo patient và khoảng thời gian
    @Query("SELECT p FROM Prescription p " +
           "WHERE p.patient.id = :patientId " +
           "AND p.prescriptionDate BETWEEN :from AND :to " +
           "ORDER BY p.prescriptionDate DESC")
    Page<Prescription> findByPatientIdAndDateRange(
            @Param("patientId") Long patientId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);
    
    // Tìm theo doctor
    @Query("SELECT DISTINCT p FROM Prescription p " +
           "JOIN FETCH p.patient pat " +
           "JOIN FETCH pat.user " +
           "JOIN FETCH p.doctor doc " +
           "JOIN FETCH doc.user " +
           "WHERE doc.id = :doctorId " +
           "ORDER BY p.prescriptionDate DESC")
    List<Prescription> findByDoctorId(@Param("doctorId") Long doctorId);
    
    // Tìm theo appointment
    Optional<Prescription> findByAppointmentId(Long appointmentId);
    
    // Đếm số đơn thuốc của patient
    Long countByPatientId(Long patientId);
    
    // Đếm số đơn thuốc của doctor
    Long countByDoctorId(Long doctorId);
    
    // Tìm tất cả prescriptions với filters (cho Admin)
    @Query("SELECT p FROM Prescription p " +
           "JOIN FETCH p.patient pat " +
           "JOIN FETCH pat.user " +
           "JOIN FETCH p.doctor doc " +
           "JOIN FETCH doc.user " +
           "WHERE (:doctorId IS NULL OR doc.id = :doctorId) " +
           "AND (:patientId IS NULL OR pat.id = :patientId) " +
           "AND (:fromDate IS NULL OR p.prescriptionDate >= :fromDate) " +
           "AND (:toDate IS NULL OR p.prescriptionDate <= :toDate)")
    Page<Prescription> findAllWithFilters(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);
}