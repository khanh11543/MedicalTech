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
     * Lịch sử optimization phân trang
     */
    Page<SystemOptimizationLog> findAllByOrderByStartedAtDesc(Pageable pageable);

    /**
     * Tìm theo loại optimization
     */
    List<SystemOptimizationLog> findByOptimizationTypeOrderByStartedAtDesc(OptimizationType type);

    /**
     * Tìm lần optimize gần nhất theo loại
     */
    Optional<SystemOptimizationLog> findTopByOptimizationTypeOrderByStartedAtDesc(OptimizationType type);

    /**
     * Tìm optimization đang chạy
     */
    List<SystemOptimizationLog> findByStatus(String status);
}
