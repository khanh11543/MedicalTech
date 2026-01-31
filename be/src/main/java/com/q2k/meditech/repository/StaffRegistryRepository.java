package com.q2k.meditech.repository;

import com.q2k.meditech.entity.StaffRegistry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for StaffRegistry entity
 * JpaSpecificationExecutor cho phép dynamic filtering
 */
@Repository
public interface StaffRegistryRepository extends JpaRepository<StaffRegistry, Long>, 
                                                  JpaSpecificationExecutor<StaffRegistry> {
    
    /**
     * Tìm staff registry theo email
     */
    Optional<StaffRegistry> findByEmail(String email);
    
    /**
     * Tìm staff registry theo phone
     */
    Optional<StaffRegistry> findByPhone(String phone);
    
    /**
     * Tìm staff registry theo invitation token
     */
    Optional<StaffRegistry> findByInvitationToken(String invitationToken);
    
    /**
     * Check email đã tồn tại trong registry chưa
     */
    boolean existsByEmail(String email);
    
    /**
     * Check phone đã tồn tại trong registry chưa
     */
    boolean existsByPhone(String phone);
    
    /**
     * Tìm staff registry theo ID với eager loading
     * Để tránh N+1 query khi cần thông tin invitedBy, disabledBy
     */
    @Query("SELECT sr FROM StaffRegistry sr " +
           "LEFT JOIN FETCH sr.invitedBy " +
           "LEFT JOIN FETCH sr.disabledBy " +
           "LEFT JOIN FETCH sr.registeredUser " +
           "WHERE sr.id = :id")
    Optional<StaffRegistry> findByIdWithDetails(@Param("id") Long id);
    
    /**
     * Tìm kiếm staff registry với filter động
     * Search trong email, phone, fullName
     */
    @Query("SELECT sr FROM StaffRegistry sr WHERE " +
           "(:query IS NULL OR " +
           "LOWER(sr.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sr.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sr.fullName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<StaffRegistry> searchStaffRegistry(@Param("query") String query, Pageable pageable);
    
    /**
     * Count theo status
     */
    long countByStatus(String status);
    
    /**
     * Count theo expected role
     */
    long countByExpectedRole(String expectedRole);
}