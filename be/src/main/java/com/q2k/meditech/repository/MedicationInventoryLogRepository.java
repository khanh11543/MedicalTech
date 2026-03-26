package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MedicationInventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicationInventoryLogRepository
        extends JpaRepository<MedicationInventoryLog, Long>,
                JpaSpecificationExecutor<MedicationInventoryLog> {

    Page<MedicationInventoryLog> findByMedicationIdOrderByChangedAtDesc(Long medicationId, Pageable pageable);

    long countByMedicationId(Long medicationId);

    @Query("SELECT DISTINCT l.type FROM MedicationInventoryLog l ORDER BY l.type")
    List<String> findDistinctTypes();

    @Query("SELECT DISTINCT l.referenceType FROM MedicationInventoryLog l WHERE l.referenceType IS NOT NULL ORDER BY l.referenceType")
    List<String> findDistinctReferenceTypes();

    @Query("SELECT COUNT(l) FROM MedicationInventoryLog l WHERE l.changedAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT l.type, COUNT(l) FROM MedicationInventoryLog l WHERE l.changedAt >= :since GROUP BY l.type")
    List<Object[]> countByTypeSince(@Param("since") LocalDateTime since);
}
