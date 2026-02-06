package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    /**
     * Find patient by user ID
     */
    Optional<Patient> findByUserId(Long userId);

    /**
     * Check if patient exists by user ID
     */
    boolean existsByUserId(Long userId);
}
