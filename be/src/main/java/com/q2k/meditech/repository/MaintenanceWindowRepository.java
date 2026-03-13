package com.q2k.meditech.repository;

import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceWindowRepository extends JpaRepository<MaintenanceWindow, Long> {

    /**
     * Find active maintenance
     */
    List<MaintenanceWindow> findByStatus(MaintenanceStatus status);

    /**
     * Check if there is active maintenance
     */
    boolean existsByStatus(MaintenanceStatus status);

    /**
     * Find upcoming maintenance (scheduled + startTime in the future)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'SCHEDULED' AND m.startTime > :now ORDER BY m.startTime ASC")
    List<MaintenanceWindow> findUpcoming(@Param("now") LocalDateTime now);

    /**
     * Find maintenance ready to activate (scheduled + startTime <= now + endTime > now)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'SCHEDULED' AND m.startTime <= :now AND m.endTime > :now")
    List<MaintenanceWindow> findReadyToActivate(@Param("now") LocalDateTime now);

    /**
     * Find expired active maintenance (active + endTime <= now)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'ACTIVE' AND m.endTime <= :now")
    List<MaintenanceWindow> findExpiredActive(@Param("now") LocalDateTime now);

    /**
     * Paginated maintenance history
     */
    Page<MaintenanceWindow> findAllByOrderByStartTimeDesc(Pageable pageable);

    /**
     * Completed maintenance history
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status IN ('COMPLETED', 'CANCELLED') ORDER BY m.actualEndTime DESC")
    Page<MaintenanceWindow> findHistory(Pageable pageable);
}
