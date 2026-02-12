package com.q2k.meditech.repository;

import com.q2k.meditech.entity.PrescriptionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionTemplateRepository extends JpaRepository<PrescriptionTemplate, Long> {
    
    // Tìm template với đầy đủ thông tin
    @Query("SELECT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE t.id = :id")
    Optional<PrescriptionTemplate> findByIdWithDetails(@Param("id") Long id);
    
    // Tìm tất cả template của doctor
    @Query("SELECT DISTINCT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE d.id = :doctorId " +
           "ORDER BY t.usageCount DESC, t.templateName ASC")
    List<PrescriptionTemplate> findByDoctorId(@Param("doctorId") Long doctorId);
    
    // Tìm template active của doctor
    @Query("SELECT DISTINCT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE d.id = :doctorId AND t.isActive = true " +
           "ORDER BY t.usageCount DESC, t.templateName ASC")
    List<PrescriptionTemplate> findByDoctorIdAndIsActiveTrue(@Param("doctorId") Long doctorId);
    
    // Kiểm tra template có thuộc về doctor không
    boolean existsByIdAndDoctorId(Long id, Long doctorId);
    
    // Tìm theo tên (cho việc kiểm tra trùng)
    Optional<PrescriptionTemplate> findByDoctorIdAndTemplateName(Long doctorId, String templateName);
    
    // Đếm số template của doctor
    Long countByDoctorId(Long doctorId);
    
    // Đếm số template active của doctor
    Long countByDoctorIdAndIsActiveTrue(Long doctorId);
}