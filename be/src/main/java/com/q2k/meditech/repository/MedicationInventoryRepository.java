package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicationInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicationInventoryRepository extends JpaRepository<MedicationInventory, Long> {

    Optional<MedicationInventory> findByMedicationId(Long medicationId);
}
