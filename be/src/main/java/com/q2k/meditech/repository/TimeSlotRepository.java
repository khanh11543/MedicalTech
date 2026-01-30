package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

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
     * Check if a slot exists
     */
    boolean existsByDoctorIdAndSlotDateAndStartTime(
            Long doctorId,
            LocalDate slotDate,
            java.time.LocalTime startTime
    );
}
