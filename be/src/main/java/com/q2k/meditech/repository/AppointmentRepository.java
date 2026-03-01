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

    // ==================== DOCTOR DASHBOARD QUERIES ====================

    /**
     * Find today's appointments for doctor dashboard (with patient info for display)
     * JOIN FETCH patient + user to avoid LazyInitializationException
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patient p " +
           "LEFT JOIN FETCH p.user " +
           "WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date " +
           "ORDER BY a.startTime")
    List<Appointment> findByDoctorIdAndDateForDashboard(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date);

    /**
     * Count appointments by doctor in a date range (for weekly stats)
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate BETWEEN :fromDate AND :toDate")
    Long countByDoctorIdAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Count appointments by doctor, status and date range (for no-show rate)
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.status = :status " +
           "AND a.appointmentDate BETWEEN :fromDate AND :toDate")
    Long countByDoctorIdAndStatusAndDateRange(
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Find all appointments with filters for admin (with JOIN FETCH to avoid N+1)
     */
    @Query("SELECT DISTINCT a FROM Appointment a " +
            "LEFT JOIN FETCH a.patient p " +
            "LEFT JOIN FETCH p.user " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user " +
            "WHERE (:doctorId IS NULL OR a.doctor.id = :doctorId) " +
            "AND (:patientId IS NULL OR a.patient.id = :patientId) " +
            "AND (:status IS NULL OR CAST(a.status AS string) = :status) " +
            "AND (:fromDate IS NULL OR a.appointmentDate >= :fromDate) " +
            "AND (:toDate IS NULL OR a.appointmentDate <= :toDate) " +
            "ORDER BY a.appointmentDate ASC, a.startTime ASC")
    Page<Appointment> findAllWithFiltersAdmin(
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("status") String status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );
}
