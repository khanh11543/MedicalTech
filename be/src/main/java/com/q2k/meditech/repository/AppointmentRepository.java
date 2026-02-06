package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByAppointmentCode(String appointmentCode);

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

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
}
