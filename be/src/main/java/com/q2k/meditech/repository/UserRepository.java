package com.q2k.meditech.repository;

import com.q2k.meditech.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity
 * JpaSpecificationExecutor cho phép sử dụng Specification để filter động
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

       /**
        * Tìm user theo email
        */
       Optional<User> findByEmail(String email);

       /**
        * Tìm user theo phone
        */
       Optional<User> findByPhone(String phone);

       /**
        * Check email đã tồn tại chưa
        */
       boolean existsByEmail(String email);

       /**
        * Check phone đã tồn tại chưa
        */
       boolean existsByPhone(String phone);

       /**
        * Tìm user theo email và fetch roles cùng lúc (để tránh N+1 query)
        */
       @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.email = :email")
       Optional<User> findByEmailWithRoles(@Param("email") String email);

       /**
        * Tìm user theo ID và fetch roles
        */
       @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.id = :id")
       Optional<User> findByIdWithRoles(@Param("id") Long id);

       /**
        * Tìm kiếm users với filter động
        * Search trong email, phone
        */
       @Query("SELECT u FROM User u WHERE " +
                     "(:query IS NULL OR " +
                     "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                     "LOWER(u.phone) LIKE LOWER(CONCAT('%', :query, '%')))")
       Page<User> searchUsers(@Param("query") String query, Pageable pageable);

       /**
        * Find users who have a specific role but do NOT have a corresponding profile
        * in the given table.
        * Used to sync missing Receptionist/Patient profiles.
        */
       @Query("SELECT u FROM User u JOIN u.userRoles ur JOIN ur.role r " +
                     "WHERE r.name = :roleName " +
                     "AND u.id NOT IN (SELECT rec.user.id FROM Receptionist rec)")
       List<User> findUsersWithRoleMissingReceptionistProfile(@Param("roleName") String roleName);

       @Query("SELECT u FROM User u JOIN u.userRoles ur JOIN ur.role r " +
                     "WHERE r.name = :roleName " +
                     "AND u.id NOT IN (SELECT p.user.id FROM Patient p)")
       List<User> findUsersWithRoleMissingPatientProfile(@Param("roleName") String roleName);
}
