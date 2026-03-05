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

    // ==================== BASIC QUERIES ====================

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :dateFrom AND ts.slotDate <= :dateTo " +
            "AND ts.status = 'AVAILABLE' " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findAvailableSlots(
            @Param("doctorId") Long doctorId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId AND ts.slotDate = :date " +
            "ORDER BY ts.startTime ASC")
    List<TimeSlot> findByDoctorIdAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date);

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate AND ts.slotDate <= :endDate " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByDoctorIdAndSlotDateAndStartTime(Long doctorId, LocalDate slotDate, LocalTime startTime);

    Optional<TimeSlot> findByDoctorIdAndSlotDateAndStartTime(Long doctorId, LocalDate slotDate, LocalTime startTime);

    @Query("SELECT ts FROM TimeSlot ts JOIN FETCH ts.doctor d WHERE ts.id = :id")
    Optional<TimeSlot> findByIdWithDoctor(@Param("id") Long id);

    // ==================== OVERLAP DETECTION ====================

    /**
     * Check if any slot overlaps with a given time range for a doctor on a specific date.
     * Overlap: existing.start < newEnd AND existing.end > newStart
     */
    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate = :slotDate " +
            "AND ts.startTime < :endTime " +
            "AND ts.endTime > :startTime " +
            "AND (:excludeId IS NULL OR ts.id <> :excludeId)")
    List<TimeSlot> findOverlappingSlots(
            @Param("doctorId") Long doctorId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);

    // ==================== ADMIN LIST / FILTER ====================

    @Query("SELECT ts FROM TimeSlot ts JOIN FETCH ts.doctor d " +
            "WHERE (:doctorId IS NULL OR ts.doctor.id = :doctorId) " +
            "AND (:date IS NULL OR ts.slotDate = :date) " +
            "AND (:dateFrom IS NULL OR ts.slotDate >= :dateFrom) " +
            "AND (:dateTo IS NULL OR ts.slotDate <= :dateTo) " +
            "AND (:status IS NULL OR ts.status = :status) " +
            "AND (:source IS NULL OR ts.source = :source) " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findAllWithFilters(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("status") String status,
            @Param("source") String source);

    @Query("SELECT COUNT(ts) FROM TimeSlot ts " +
            "WHERE (:doctorId IS NULL OR ts.doctor.id = :doctorId) " +
            "AND (:date IS NULL OR ts.slotDate = :date) " +
            "AND (:dateFrom IS NULL OR ts.slotDate >= :dateFrom) " +
            "AND (:dateTo IS NULL OR ts.slotDate <= :dateTo) " +
            "AND (:status IS NULL OR ts.status = :status) " +
            "AND (:source IS NULL OR ts.source = :source)")
    long countWithFilters(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("status") String status,
            @Param("source") String source);

    // ==================== BACKWARD COMPAT (old 5-param signatures) ====================

    default List<TimeSlot> findAllWithFilters(Long doctorId, LocalDate date, LocalDate dateFrom, LocalDate dateTo, String status) {
        return findAllWithFilters(doctorId, date, dateFrom, dateTo, status, null);
    }

    default long countWithFilters(Long doctorId, LocalDate date, LocalDate dateFrom, LocalDate dateTo, String status) {
        return countWithFilters(doctorId, date, dateFrom, dateTo, status, null);
    }

    // ==================== CALENDAR / STATISTICS ====================

    @Query("SELECT ts.status, COUNT(ts) FROM TimeSlot ts " +
            "WHERE ts.slotDate = :date " +
            "AND (:doctorId IS NULL OR ts.doctor.id = :doctorId) " +
            "GROUP BY ts.status")
    List<Object[]> countByStatusForDate(
            @Param("date") LocalDate date,
            @Param("doctorId") Long doctorId);

    @Query("SELECT ts.slotDate, ts.status, COUNT(ts) FROM TimeSlot ts " +
            "WHERE ts.slotDate >= :dateFrom AND ts.slotDate <= :dateTo " +
            "AND (:doctorId IS NULL OR ts.doctor.id = :doctorId) " +
            "GROUP BY ts.slotDate, ts.status " +
            "ORDER BY ts.slotDate ASC")
    List<Object[]> countByDateAndStatus(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("doctorId") Long doctorId);

    /** Per-doctor available count for a date (for "lowest availability" KPI) */
    @Query("SELECT ts.doctor.id, ts.doctor.fullName, COUNT(ts) FROM TimeSlot ts " +
            "WHERE ts.slotDate = :date AND ts.status = 'AVAILABLE' " +
            "GROUP BY ts.doctor.id, ts.doctor.fullName " +
            "ORDER BY COUNT(ts) ASC")
    List<Object[]> countAvailablePerDoctorForDate(@Param("date") LocalDate date);

    // ==================== BULK OPS ====================

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.id IN :ids")
    List<TimeSlot> findAllByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE TimeSlot ts SET ts.status = 'BLOCKED', ts.blockReason = :reason, ts.blockedBy = :blockedBy " +
            "WHERE ts.id IN :ids AND ts.status = 'AVAILABLE'")
    int bulkBlockSlots(@Param("ids") List<Long> ids, @Param("reason") String reason, @Param("blockedBy") Long blockedBy);

    @Modifying
    @Query("UPDATE TimeSlot ts SET ts.status = 'AVAILABLE', ts.blockReason = NULL, ts.blockNote = NULL, " +
            "ts.blockUntil = NULL, ts.blockedBy = NULL, ts.blockedAt = NULL " +
            "WHERE ts.id IN :ids AND ts.status = 'BLOCKED'")
    int bulkUnblockSlots(@Param("ids") List<Long> ids);

    @Modifying
    @Query("DELETE FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate AND ts.slotDate <= :endDate " +
            "AND ts.status = 'AVAILABLE'")
    int deleteAvailableSlotsByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(ts) FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate AND ts.slotDate <= :endDate")
    long countByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id = :doctorId " +
            "AND ts.slotDate >= :startDate AND ts.slotDate <= :endDate " +
            "AND ts.status IN ('BOOKED', 'BLOCKED', 'COMPLETED') " +
            "ORDER BY ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findNonAvailableSlots(
            @Param("doctorId") Long doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // ==================== BATCH LOAD FOR BULK CREATE ====================

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.doctor.id IN :doctorIds " +
            "AND ts.slotDate >= :startDate AND ts.slotDate <= :endDate " +
            "ORDER BY ts.doctor.id ASC, ts.slotDate ASC, ts.startTime ASC")
    List<TimeSlot> findByDoctorIdsAndDateRange(
            @Param("doctorIds") List<Long> doctorIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // ==================== BATCH ROLLBACK ====================

    @Query("SELECT ts FROM TimeSlot ts WHERE ts.batchId = :batchId AND ts.status = 'AVAILABLE' ORDER BY ts.slotDate, ts.startTime")
    List<TimeSlot> findAvailableByBatchId(@Param("batchId") String batchId);

    @Modifying
    @Query("DELETE FROM TimeSlot ts WHERE ts.batchId = :batchId AND ts.status = 'AVAILABLE'")
    int deleteAvailableByBatchId(@Param("batchId") String batchId);

    // ==================== HOLIDAY AUTO-BLOCK ====================

    @Query("SELECT ts FROM TimeSlot ts " +
            "WHERE ts.slotDate = :date AND ts.status = 'AVAILABLE'")
    List<TimeSlot> findAvailableSlotsByDate(@Param("date") LocalDate date);
}
