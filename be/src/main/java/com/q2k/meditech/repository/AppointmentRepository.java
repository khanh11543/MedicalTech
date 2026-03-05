package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    // Fetch appointment with all details
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user du " +
           "WHERE a.id = :id")
    Optional<Appointment> findByIdWithDetails(@Param("id") Long id);

    // Find appointments by patient
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user " +
           "WHERE p.id = :patientId")
    List<Appointment> findByPatientId(@Param("patientId") Long patientId);

    // Find appointments by doctor
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user " +
           "WHERE d.id = :doctorId")
    List<Appointment> findByDoctorId(@Param("doctorId") Long doctorId);

    // Find appointments by doctor and date
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user " +
           "WHERE d.id = :doctorId AND a.appointmentDate = :date " +
           "ORDER BY a.startTime")
    List<Appointment> findByDoctorIdAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    // Check for conflicting appointments
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND ((a.startTime <= :startTime AND a.endTime > :startTime) " +
           "     OR (a.startTime < :endTime AND a.endTime >= :endTime) " +
           "     OR (a.startTime >= :startTime AND a.endTime <= :endTime))")
    List<Appointment> findConflictingAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    // Check for conflicting appointments excluding a specific appointment (for rescheduling)
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.id != :excludeId " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND ((a.startTime <= :startTime AND a.endTime > :startTime) " +
           "     OR (a.startTime < :endTime AND a.endTime >= :endTime) " +
           "     OR (a.startTime >= :startTime AND a.endTime <= :endTime))")
    List<Appointment> findConflictingAppointmentsExcluding(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);

    // Get max queue number for a doctor on a specific date
    @Query("SELECT COALESCE(MAX(a.queueNumber), 0) FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date")
    Integer getMaxQueueNumber(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    // Count appointments by status for a doctor
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId AND a.status = :status")
    Long countByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") AppointmentStatus status);

    // Find appointments within date range
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :fromDate AND :toDate " +
           "ORDER BY a.appointmentDate, a.startTime")
    List<Appointment> findByDateRange(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    // Complex filter query using Specification is better, but here's a sample
    Page<Appointment> findByPatientIdAndStatusAndAppointmentDateBetween(
            Long patientId,
            AppointmentStatus status,
            LocalDate from,
            LocalDate to,
            Pageable pageable);

    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);

    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date, Pageable pageable);

    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    List<Appointment> findByPatientIdAndStatus(Long patientId, String status);

    /**
     * Tìm lịch hẹn CONFIRMED có ngày khám = ngày chỉ định (dùng cho nhắc nhở)
     */
    @Query("SELECT a FROM Appointment a " +
            "JOIN FETCH a.patient p " +
            "JOIN FETCH p.user u " +
            "JOIN FETCH a.doctor d " +
            "WHERE a.appointmentDate = :date " +
            "AND a.status = 'CONFIRMED'")
    List<Appointment> findConfirmedAppointmentsByDate(@Param("date") LocalDate date);

    /**
     * Tìm lịch hẹn PENDING có ngày khám = ngày chỉ định
     */
    @Query("SELECT a FROM Appointment a " +
            "JOIN FETCH a.patient p " +
            "JOIN FETCH p.user u " +
            "JOIN FETCH a.doctor d " +
            "WHERE a.appointmentDate = :date " +
            "AND a.status = 'PENDING'")
    List<Appointment> findPendingAppointmentsByDate(@Param("date") LocalDate date);

    /**
     * Đếm lịch hẹn trong ngày của bác sĩ
     */
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date AND a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    long countActiveAppointmentsByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    /**
     * Check trùng lịch
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.timeSlot.id = :timeSlotId AND a.status NOT IN ('CANCELLED', 'RESCHEDULED')")
    boolean existsByTimeSlotAndNotCancelled(@Param("timeSlotId") Long timeSlotId);
    
    /**
     * Count total appointments by patient
     */
    Long countByPatientId(Long patientId);
    
    /**
     * Count appointments by patient and status
     */
    Long countByPatientIdAndStatus(Long patientId, AppointmentStatus status);
    
    /**
     * Count appointments by patient and doctor
     */
    Long countByPatientIdAndDoctorId(Long patientId, Long doctorId);
    
    // ==================== STATISTICS QUERIES ====================
    
    /**
     * Count appointments by status in date range
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = :status")
    Long countByStatusInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status);
    
    /**
     * Count total appointments in date range
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId)")
    Long countInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get appointments count by date (for time series)
     */
    @Query("SELECT a.appointmentDate, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "GROUP BY a.appointmentDate " +
           "ORDER BY a.appointmentDate")
    List<Object[]> countByDateInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get appointments count by date and status (for time series)
     */
    @Query("SELECT a.appointmentDate, a.status, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "GROUP BY a.appointmentDate, a.status " +
           "ORDER BY a.appointmentDate")
    List<Object[]> countByDateAndStatusInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get status distribution
     */
    @Query("SELECT a.status, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "GROUP BY a.status")
    List<Object[]> getStatusDistribution(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get doctor stats with counts
     */
    @Query("SELECT a.doctor, " +
           "COUNT(a), " +
           "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) " +
           "FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "GROUP BY a.doctor " +
           "ORDER BY COUNT(a) DESC")
    Page<Object[]> getDoctorStats(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);
    
    /**
     * Get appointments by day of week and hour
     */
    @Query("SELECT FUNCTION('DAYOFWEEK', a.appointmentDate), FUNCTION('HOUR', a.startTime), COUNT(a) " +
           "FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status NOT IN ('CANCELLED') " +
           "GROUP BY FUNCTION('DAYOFWEEK', a.appointmentDate), FUNCTION('HOUR', a.startTime)")
    List<Object[]> getHeatmapData(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get cancellations by reason
     */
    @Query("SELECT a.cancellationReason, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = 'CANCELLED' " +
           "GROUP BY a.cancellationReason " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> getCancellationReasons(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get cancellations by cancelled by user role
     */
    @Query("SELECT a.cancelledBy, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = 'CANCELLED' " +
           "GROUP BY a.cancelledBy")
    List<Object[]> getCancellationsByRole(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get no-shows with patient info
     */
    @Query("SELECT a.patient.id, a.patient.user.fullName, a.patient.user.phone, COUNT(a), MAX(a.appointmentDate) " +
           "FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = 'NO_SHOW' " +
           "GROUP BY a.patient.id, a.patient.user.fullName, a.patient.user.phone " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> getNoShowPatients(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get no-shows by day of week
     */
    @Query("SELECT FUNCTION('DAYOFWEEK', a.appointmentDate), COUNT(a) " +
           "FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = 'NO_SHOW' " +
           "GROUP BY FUNCTION('DAYOFWEEK', a.appointmentDate)")
    List<Object[]> getNoShowsByDayOfWeek(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get appointments that should have been attended (for no-show rate calculation)
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW')")
    Long countScheduledAppointments(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Get completed appointments with check-in time (for wait time calculation)
     */
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "AND a.status = 'COMPLETED' " +
           "AND a.checkedInAt IS NOT NULL " +
           "AND a.consultationStartedAt IS NOT NULL")
    List<Appointment> findCompletedWithTimestamps(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("doctorId") Long doctorId);
    
    /**
     * Check for conflicting appointments of a PATIENT (for reschedule: exclude current appointment)
     */
    @Query("SELECT a FROM Appointment a " +
           "WHERE a.patient.id = :patientId " +
           "AND a.appointmentDate = :date " +
           "AND a.id != :excludeId " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED') " +
           "AND ((a.startTime <= :startTime AND a.endTime > :startTime) " +
           "     OR (a.startTime < :endTime AND a.endTime >= :endTime) " +
           "     OR (a.startTime >= :startTime AND a.endTime <= :endTime))")
    List<Appointment> findPatientConflictingAppointmentsExcluding(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);

    /**
     * Count distinct doctors in range
     */
    @Query("SELECT COUNT(DISTINCT a.doctor.id) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :from AND :to")
    Long countDistinctDoctors(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    // ==================== QUEUE MANAGEMENT QUERIES ====================

    /**
     * Find all queued patients (CHECKED_IN or IN_PROGRESS) for a doctor today,
     * ordered by queue number.
     */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user du " +
           "WHERE d.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status IN :statuses " +
           "ORDER BY a.queueNumber ASC")
    List<Appointment> findQueuedByDoctorAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("statuses") List<AppointmentStatus> statuses);

    /**
     * Find all queued patients across ALL doctors for today.
     */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user du " +
           "WHERE a.appointmentDate = :date " +
           "AND a.status IN :statuses " +
           "ORDER BY a.queueNumber ASC")
    List<Appointment> findAllQueuedByDate(
            @Param("date") LocalDate date,
            @Param("statuses") List<AppointmentStatus> statuses);

    /**
     * Find queue-related history events (for audit log).
     */
    @Query("SELECT h FROM AppointmentHistory h " +
           "JOIN FETCH h.appointment a " +
           "WHERE a.appointmentDate = :date " +
           "AND h.action IN :actions " +
           "ORDER BY h.changedAt DESC")
    List<com.q2k.meditech.entity.AppointmentHistory> findQueueAuditEvents(
            @Param("date") LocalDate date,
            @Param("actions") List<String> actions);

    /**
     * Find queue-related history events for a specific doctor.
     */
    @Query("SELECT h FROM AppointmentHistory h " +
           "JOIN FETCH h.appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND h.action IN :actions " +
           "ORDER BY h.changedAt DESC")
    List<com.q2k.meditech.entity.AppointmentHistory> findQueueAuditEventsByDoctor(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("actions") List<String> actions);

    // ==================== REPORT QUERIES (Tab 6) ====================

    /**
     * Find all appointments on a date with full details for Daily Appointment Report (6.1).
     * Optionally filtered by doctor.
     */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user du " +
           "WHERE a.appointmentDate = :date " +
           "AND (:doctorId IS NULL OR d.id = :doctorId) " +
           "ORDER BY a.startTime, a.queueNumber")
    List<Appointment> findByDateWithDetailsForReport(
            @Param("date") LocalDate date,
            @Param("doctorId") Long doctorId);

    /**
     * Find checked-in / in-progress / completed appointments on a date with timestamps
     * for Queue Performance Report (6.3).
     */
    @Query("SELECT a FROM Appointment a " +
           "JOIN FETCH a.patient p " +
           "JOIN FETCH p.user pu " +
           "JOIN FETCH a.doctor d " +
           "JOIN FETCH d.user du " +
           "WHERE a.appointmentDate = :date " +
           "AND a.status IN ('CHECKED_IN', 'IN_PROGRESS', 'COMPLETED') " +
           "ORDER BY d.id, a.checkedInAt")
    List<Appointment> findQueuePerformanceData(@Param("date") LocalDate date);

    /**
     * Count appointments by status on a specific date.
     */
    @Query("SELECT a.status, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate = :date " +
           "AND (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
           "GROUP BY a.status")
    List<Object[]> countByStatusOnDate(
            @Param("date") LocalDate date,
            @Param("doctorId") Long doctorId);

    // ==================== TIME SLOT INTEGRATION ====================

    @Query("SELECT a FROM Appointment a WHERE a.timeSlot.id = :timeSlotId")
    Optional<Appointment> findByTimeSlotId(@Param("timeSlotId") Long timeSlotId);

    @Query("SELECT a.appointmentCode FROM Appointment a WHERE a.timeSlot.id = :timeSlotId")
    Optional<String> findAppointmentCodeByTimeSlotId(@Param("timeSlotId") Long timeSlotId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :slotDate " +
           "AND a.startTime = :startTime AND a.endTime = :endTime " +
           "AND a.status <> com.q2k.meditech.entity.enums.AppointmentStatus.CANCELLED " +
           "ORDER BY a.id DESC")
    Optional<Appointment> findByDoctorAndDateTime(
            @Param("doctorId") Long doctorId,
            @Param("slotDate") LocalDate slotDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);
}