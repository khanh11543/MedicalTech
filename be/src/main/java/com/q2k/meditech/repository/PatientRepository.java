package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    @Query("SELECT p FROM Patient p WHERE p.user.id = :userId")
    Optional<Patient> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT p FROM Patient p JOIN FETCH p.user WHERE p.id = :id")
    Optional<Patient> findByIdWithUser(@Param("id") Long id);

    boolean existsByUserId(Long userId);

    @Query("SELECT p FROM Patient p JOIN FETCH p.user u WHERE " +
            "(:q IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) " +
            "OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "AND (:gender IS NULL OR p.gender = :gender) " +
            "AND (:bloodGroup IS NULL OR p.bloodGroup = :bloodGroup) " +
            "AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<Patient> findAllWithFilters(
            @Param("q") String q,
            @Param("gender") String gender,
            @Param("bloodGroup") String bloodGroup,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}


