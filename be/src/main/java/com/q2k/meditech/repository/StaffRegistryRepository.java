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
 * JpaSpecificationExecutor enables dynamic filtering
 */
@Repository
public interface StaffRegistryRepository extends JpaRepository<StaffRegistry, Long>, 
                                                  JpaSpecificationExecutor<StaffRegistry> {
    
    /**
     * Find staff registry by email
     */
    Optional<StaffRegistry> findByEmail(String email);
    
    /**
     * Find staff registry by phone
     */
    Optional<StaffRegistry> findByPhone(String phone);
    
    /**
     * Find staff registry by invitation token
     */
    Optional<StaffRegistry> findByInvitationToken(String invitationToken);
    
    /**
     * Check if email already exists in registry
     */
    boolean existsByEmail(String email);
    
    /**
     * Check if phone already exists in registry
     */
    boolean existsByPhone(String phone);
    
    /**
     * Find staff registry by ID with eager loading
     * To avoid N+1 query when needing invitedBy, disabledBy info
     */
    @Query("SELECT sr FROM StaffRegistry sr " +
           "LEFT JOIN FETCH sr.invitedBy " +
           "LEFT JOIN FETCH sr.disabledBy " +
           "LEFT JOIN FETCH sr.registeredUser " +
           "WHERE sr.id = :id")
    Optional<StaffRegistry> findByIdWithDetails(@Param("id") Long id);
    
    /**
     * Search staff registry with dynamic filter
     * Search in email, phone, fullName
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