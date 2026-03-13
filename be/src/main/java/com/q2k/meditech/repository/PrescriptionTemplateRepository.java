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
    
    // Find template with full details
    @Query("SELECT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE t.id = :id")
    Optional<PrescriptionTemplate> findByIdWithDetails(@Param("id") Long id);
    
    // Find all templates of a doctor
    @Query("SELECT DISTINCT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE d.id = :doctorId " +
           "ORDER BY t.usageCount DESC, t.templateName ASC")
    List<PrescriptionTemplate> findByDoctorId(@Param("doctorId") Long doctorId);
    
    // Find active templates of a doctor
    @Query("SELECT DISTINCT t FROM PrescriptionTemplate t " +
           "JOIN FETCH t.doctor d " +
           "JOIN FETCH d.user " +
           "LEFT JOIN FETCH t.items " +
           "WHERE d.id = :doctorId AND t.isActive = true " +
           "ORDER BY t.usageCount DESC, t.templateName ASC")
    List<PrescriptionTemplate> findByDoctorIdAndIsActiveTrue(@Param("doctorId") Long doctorId);
    
    // Check if template belongs to a doctor
    boolean existsByIdAndDoctorId(Long id, Long doctorId);
    
    // Find by name (for duplicate checking)
    Optional<PrescriptionTemplate> findByDoctorIdAndTemplateName(Long doctorId, String templateName);
    
    // Count doctor's templates
    Long countByDoctorId(Long doctorId);
    
    // Count doctor's active templates
    Long countByDoctorIdAndIsActiveTrue(Long doctorId);
}