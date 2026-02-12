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
     * Tìm role theo tên
     */
    Optional<Role> findByName(String name);
    
    /**
     * Tìm nhiều roles theo tên
     */
    List<Role> findByNameIn(Set<String> names);
    
    /**
     * TÌm nhiều roles theo IDs
     */
    @Query("SELECT r FROM Role r WHERE r.id IN :ids")
    List<Role> findByIdIn(@Param("ids") Set<Long> ids);
    
    /**
     * Check role name đã tồn tại chưa
     */
    boolean existsByName(String name);
}