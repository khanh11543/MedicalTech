package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Investigation;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InvestigationRepository extends JpaRepository<Investigation, Long>, JpaSpecificationExecutor<Investigation> {

    Page<Investigation> findByStatusOrderByCreatedAtDesc(InvestigationStatus status, Pageable pageable);

    Page<Investigation> findByAssignedToIdOrderByCreatedAtDesc(Long assignedToId, Pageable pageable);

    Page<Investigation> findByTypeOrderByCreatedAtDesc(InvestigationType type, Pageable pageable);

    Page<Investigation> findBySeverityOrderByCreatedAtDesc(SecuritySeverity severity, Pageable pageable);

    long countByStatus(InvestigationStatus status);

    @Query("SELECT COUNT(i) FROM Investigation i WHERE i.status = 'OPEN' " +
           "AND i.dueDate < :today")
    long countOverdue(@Param("today") LocalDate today);

    @Query("SELECT COUNT(i) FROM Investigation i WHERE i.status = 'RESOLVED' " +
           "AND i.resolvedAt BETWEEN :from AND :to")
    long countResolvedBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT i FROM Investigation i WHERE i.status IN :statuses " +
           "ORDER BY i.createdAt DESC")
    Page<Investigation> findByStatusIn(
            @Param("statuses") List<InvestigationStatus> statuses,
            Pageable pageable);

    @Query("SELECT i FROM Investigation i WHERE i.assignedTo.id = :userId " +
           "AND i.status IN ('OPEN', 'IN_PROGRESS') ORDER BY i.dueDate ASC")
    List<Investigation> findActiveByAssignedTo(@Param("userId") Long userId);

    List<Investigation> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);
}
