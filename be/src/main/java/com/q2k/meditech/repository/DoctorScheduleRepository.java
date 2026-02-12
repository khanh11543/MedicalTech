package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    /**
     * Find all schedules for a doctor
     */
    List<DoctorSchedule> findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(Long doctorId);

    /**
     * Find schedules for a doctor by day of week
     */
    List<DoctorSchedule> findByDoctorIdAndDayOfWeekOrderByStartTimeAsc(Long doctorId, Integer dayOfWeek);

    /**
     * Find active schedules for a doctor
     */
    List<DoctorSchedule> findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long doctorId);

    /**
     * Find schedules for a doctor by active status
     */
    List<DoctorSchedule> findByDoctorIdAndIsActive(Long doctorId, Boolean isActive);

    /**
     * Find active schedules for a doctor by day of week
     */
    List<DoctorSchedule> findByDoctorIdAndDayOfWeekAndIsActiveTrueOrderByStartTimeAsc(Long doctorId, Integer dayOfWeek);

    /**
     * Check if a schedule conflicts with existing schedules
     */
    @Query("SELECT COUNT(ds) > 0 FROM DoctorSchedule ds " +
            "WHERE ds.doctor.id = :doctorId " +
            "AND ds.dayOfWeek = :dayOfWeek " +
            "AND ds.id != :excludeId " +
            "AND ((ds.startTime < :endTime AND ds.endTime > :startTime))")
    boolean existsConflictingSchedule(
            @Param("doctorId") Long doctorId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId
    );

    /**
     * Check if a schedule conflicts (for new schedule without ID)
     */
    @Query("SELECT COUNT(ds) > 0 FROM DoctorSchedule ds " +
            "WHERE ds.doctor.id = :doctorId " +
            "AND ds.dayOfWeek = :dayOfWeek " +
            "AND ((ds.startTime < :endTime AND ds.endTime > :startTime))")
    boolean existsConflictingScheduleNew(
            @Param("doctorId") Long doctorId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    /**
     * Find schedule by ID with doctor
     */
    @Query("SELECT ds FROM DoctorSchedule ds " +
            "JOIN FETCH ds.doctor d " +
            "WHERE ds.id = :id")
    Optional<DoctorSchedule> findByIdWithDoctor(@Param("id") Long id);
}
