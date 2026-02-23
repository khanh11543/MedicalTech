package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Receptionist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReceptionistRepository extends JpaRepository<Receptionist, Long> {

    @Query("SELECT r FROM Receptionist r JOIN FETCH r.user WHERE r.id = :id")
    Optional<Receptionist> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT r FROM Receptionist r WHERE r.user.id = :userId")
    Optional<Receptionist> findByUserId(@Param("userId") Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByEmployeeId(String employeeId);

    @Query("SELECT r FROM Receptionist r JOIN FETCH r.user u WHERE " +
            "(:q IS NULL OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(r.employeeId) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:department IS NULL OR r.department = :department) " +
            "AND (:shift IS NULL OR r.shift = :shift) " +
            "AND (:isActive IS NULL OR r.isActive = :isActive)")
    Page<Receptionist> findAllWithFilters(
            @Param("q") String q,
            @Param("department") String department,
            @Param("shift") String shift,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    long countByIsActive(boolean isActive);
}
