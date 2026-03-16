package com.q2k.meditech.repository;

import com.q2k.meditech.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity
 * JpaSpecificationExecutor enables the use of Specification for dynamic filtering
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    
    /**
     * Count users by active status
     */
    long countByIsActive(Boolean isActive);

    /**
     * Count distinct users that have the given role (by role name)
     */
    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.userRoles ur JOIN ur.role r WHERE r.name = :roleName")
    long countDistinctByRoleName(@Param("roleName") String roleName);

    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Find user by phone
     */
    Optional<User> findByPhone(String phone);
    
    /**
     * Check if email already exists
     */
    boolean existsByEmail(String email);
    
    /**
     * Check if phone already exists
     */
    boolean existsByPhone(String phone);
    
    /**
     * Find user by email and fetch roles eagerly (to avoid N+1 query)
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);
    
    /**
     * Find user by ID and fetch roles
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);
    
    /**
     * Search users with dynamic filter
     * Search in email, phone
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:query IS NULL OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);

    /**
     * Find users who have any of the specified role names (via UserRole join table).
     * Example: findByRoles_NameIn(List.of("RECEPTIONIST", "ADMIN"))
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.userRoles ur JOIN ur.role r " +
           "WHERE r.name IN :roleNames AND u.isActive = true")
    List<User> findByRoles_NameIn(@Param("roleNames") Collection<String> roleNames);

    /**
     * Find recent users with roles pre-fetched (avoids N+1)
     */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role ORDER BY u.createdAt DESC")
    List<User> findRecentWithRoles(Pageable pageable);

    @Query("SELECT u FROM User u JOIN u.userRoles ur JOIN ur.role r " +
           "WHERE r.name = :roleName " +
           "AND u.id NOT IN (SELECT p.user.id FROM Patient p)")
    List<User> findUsersWithRoleMissingPatientProfile(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u JOIN u.userRoles ur JOIN ur.role r " +
           "WHERE r.name = :roleName " +
           "AND u.id NOT IN (SELECT rec.user.id FROM Receptionist rec)")
    List<User> findUsersWithRoleMissingReceptionistProfile(@Param("roleName") String roleName);

    /**
     * Find user by auth provider and provider ID (for social login lookup)
     */
    Optional<User> findByAuthProviderAndAuthProviderId(String authProvider, String authProviderId);
}
