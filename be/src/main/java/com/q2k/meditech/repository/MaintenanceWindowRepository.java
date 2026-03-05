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
     * Tìm maintenance đang active
     */
    List<MaintenanceWindow> findByStatus(MaintenanceStatus status);

    /**
     * Kiểm tra có maintenance đang active không
     */
    boolean existsByStatus(MaintenanceStatus status);

    /**
     * Tìm maintenance sắp tới (scheduled + startTime trong tương lai)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'SCHEDULED' AND m.startTime > :now ORDER BY m.startTime ASC")
    List<MaintenanceWindow> findUpcoming(@Param("now") LocalDateTime now);

    /**
     * Tìm maintenance cần kích hoạt (scheduled + startTime <= now + endTime > now)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'SCHEDULED' AND m.startTime <= :now AND m.endTime > :now")
    List<MaintenanceWindow> findReadyToActivate(@Param("now") LocalDateTime now);

    /**
     * Tìm maintenance đã quá hạn (active + endTime <= now)
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status = 'ACTIVE' AND m.endTime <= :now")
    List<MaintenanceWindow> findExpiredActive(@Param("now") LocalDateTime now);

    /**
     * Lịch sử maintenance phân trang
     */
    Page<MaintenanceWindow> findAllByOrderByStartTimeDesc(Pageable pageable);

    /**
     * Lịch sử maintenance đã hoàn thành
     */
    @Query("SELECT m FROM MaintenanceWindow m WHERE m.status IN ('COMPLETED', 'CANCELLED') ORDER BY m.actualEndTime DESC")
    Page<MaintenanceWindow> findHistory(Pageable pageable);
}
