package com.q2k.meditech.repository;

import com.q2k.meditech.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, Long> {

    /**
     * Find all exceptions for a doctor
     */
    List<ScheduleException> findByDoctorIdOrderByExceptionDateAsc(Long doctorId);

    /**
     * Find exceptions for a doctor within a date range
     */
    @Query("SELECT se FROM ScheduleException se " +
            "WHERE se.doctor.id = :doctorId " +
            "AND se.exceptionDate >= :startDate " +
            "AND se.exceptionDate <= :endDate " +
            "ORDER BY se.exceptionDate ASC")
    List<ScheduleException> findByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find exception for a specific date
     */
    Optional<ScheduleException> findByDoctorIdAndExceptionDate(Long doctorId, LocalDate exceptionDate);

    /**
     * Check if exception exists for a date
     */
    boolean existsByDoctorIdAndExceptionDate(Long doctorId, LocalDate exceptionDate);

    /**
     * Find exception by ID with doctor
     */
    @Query("SELECT se FROM ScheduleException se " +
            "JOIN FETCH se.doctor d " +
            "WHERE se.id = :id")
    Optional<ScheduleException> findByIdWithDoctor(@Param("id") Long id);

    /**
     * Delete exceptions in date range (for regenerating slots)
     */
    void deleteByDoctorIdAndExceptionDateBetween(Long doctorId, LocalDate startDate, LocalDate endDate);
}
