package com.q2k.meditech.repository;

import com.q2k.meditech.entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, Long> {

    /**
     * Find all enabled schedules
     */
    List<BackupSchedule> findByEnabledTrue();

    /**
     * Find schedules due to run (enabled + nextRunAt <= now)
     */
    List<BackupSchedule> findByEnabledTrueAndNextRunAtBefore(LocalDateTime now);

    /**
     * Find by name
     */
    boolean existsByName(String name);
}
