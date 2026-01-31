package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    /**
     * Find available slots for a doctor within date range
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :dateFrom " +
            "AND ts.slotDate <= :dateTo " +
            "AND ts.status = 'AVAILABLE' " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findAvailableSlots(
            @Param("doctorId") Long doctorId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );

    /**
     * Find all slots for a doctor on a specific date
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate = :date " +
            "ORDER BY ts.startTime ASC")
    List<TimeSlot> findByDoctorIdAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date
    );

    /**
     * Find all slots for a doctor within date range
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate " +
            "AND ts.slotDate <= :endDate " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Check if a slot exists
     */
    boolean existsByDoctorIdAndSlotDateAndStartTime(
            Long doctorId,
            LocalDate slotDate,
            LocalTime startTime
    );

    /**
     * Find slot by doctor and specific date/time
     */
    Optional<TimeSlot> findByDoctorIdAndSlotDateAndStartTime(
            Long doctorId,
            LocalDate slotDate,
            LocalTime startTime
    );

    /**
     * Find slot by ID with doctor (for validation)
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "JOIN FETCH ts.doctor d " +
            "WHERE ts.id = :id")
    Optional<TimeSlot> findByIdWithDoctor(@Param("id") Long id);

    /**
     * Delete slots in date range that are AVAILABLE (not booked)
     */
    @Modifying
    @Query("DELETE FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate " +
            "AND ts.slotDate <= :endDate " +
            "AND ts.status = 'AVAILABLE'")
    int deleteAvailableSlotsByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Count existing slots in date range
     */
    @Query("SELECT COUNT(ts) FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate " +
            "AND ts.slotDate <= :endDate")
    long countByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find booked or blocked slots in date range
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate " +
            "AND ts.slotDate <= :endDate " +
            "AND ts.status IN ('BOOKED', 'BLOCKED', 'COMPLETED') " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findNonAvailableSlots(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
