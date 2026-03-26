package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long>,
        JpaSpecificationExecutor<Medication> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
