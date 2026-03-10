package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Prescription;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
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

    // Đếm số đơn thuốc active của patient
    Long countByPatientIdAndIsActiveTrue(Long patientId);

    // Đếm số đơn thuốc của doctor
    Long countByDoctorId(Long doctorId);

    // Tìm theo khoảng thời gian (for admin statistics)
    List<Prescription> findByPrescriptionDateBetween(LocalDate from, LocalDate to);

    // Count by status
    long countByStatus(PrescriptionStatus status);

    // Count by status within date range
    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.status = :status AND p.prescriptionDate BETWEEN :from AND :to")
    long countByStatusAndDateRange(@Param("status") PrescriptionStatus status,
                                   @Param("from") LocalDate from,
                                   @Param("to") LocalDate to);

    // Find by status
    List<Prescription> findByStatus(PrescriptionStatus status);

    // Count distinct patients in date range
    @Query("SELECT COUNT(DISTINCT p.patient.id) FROM Prescription p WHERE p.prescriptionDate BETWEEN :from AND :to")
    long countDistinctPatientsByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // Count distinct doctors in date range
    @Query("SELECT COUNT(DISTINCT p.doctor.id) FROM Prescription p WHERE p.prescriptionDate BETWEEN :from AND :to")
    long countDistinctDoctorsByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // Count distinct patients overall
    @Query("SELECT COUNT(DISTINCT p.patient.id) FROM Prescription p")
    long countDistinctPatients();

    // Count distinct doctors overall
    @Query("SELECT COUNT(DISTINCT p.doctor.id) FROM Prescription p")
    long countDistinctDoctors();
}