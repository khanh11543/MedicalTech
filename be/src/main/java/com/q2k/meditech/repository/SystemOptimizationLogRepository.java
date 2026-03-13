package com.q2k.meditech.repository;

import com.q2k.meditech.entity.SystemOptimizationLog;
import com.q2k.meditech.entity.enums.OptimizationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemOptimizationLogRepository extends JpaRepository<SystemOptimizationLog, Long> {

    /**
     * Paginated optimization history
     */
    Page<SystemOptimizationLog> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * Find by optimization type
     */
    List<SystemOptimizationLog> findByOptimizationTypeOrderByStartedAtDesc(OptimizationType type);

    /**
     * Find the most recent optimization by type
     */
    Optional<SystemOptimizationLog> findTopByOptimizationTypeOrderByStartedAtDesc(OptimizationType type);

    /**
     * Find running optimizations
     */
    List<SystemOptimizationLog> findByStatus(String status);
}
