package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long>,
        JpaSpecificationExecutor<Medication> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    Optional<Medication> findByCode(String code);

    @Query(value = "SELECT MAX(CAST(SUBSTRING(code, 4) AS UNSIGNED)) " +
            "FROM medications WHERE code LIKE 'MED%'", nativeQuery = true)
    Long findMaxMedicationCodeNumber();
}
