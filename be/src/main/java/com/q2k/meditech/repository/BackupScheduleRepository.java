package com.q2k.meditech.repository;

import com.q2k.meditech.entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, Long> {

    /**
     * Tìm tất cả schedule đang bật
     */
    List<BackupSchedule> findByEnabledTrue();

    /**
     * Tìm schedule cần chạy (enabled + nextRunAt <= now)
     */
    List<BackupSchedule> findByEnabledTrueAndNextRunAtBefore(LocalDateTime now);

    /**
     * Tìm theo tên
     */
    boolean existsByName(String name);
}
