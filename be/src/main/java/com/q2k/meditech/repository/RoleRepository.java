package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Repository for Role entity
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    /**
     * Find role by name
     */
    Optional<Role> findByName(String name);
    
    /**
     * Find multiple roles by name
     */
    List<Role> findByNameIn(Set<String> names);
    
    /**
     * Find multiple roles by IDs
     */
    @Query("SELECT r FROM Role r WHERE r.id IN :ids")
    List<Role> findByIdIn(@Param("ids") Set<Long> ids);
    
    /**
     * Check if role name already exists
     */
    boolean existsByName(String name);
}