package com.q2k.meditech.repository;

import com.q2k.meditech.entity.AppointmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentHistoryRepository extends JpaRepository<AppointmentHistory, Long> {

    @Query("SELECT h FROM AppointmentHistory h " +
           "WHERE h.appointment.id = :appointmentId " +
           "ORDER BY h.changedAt DESC")
    List<AppointmentHistory> findByAppointmentIdOrderByChangedAtDesc(@Param("appointmentId") Long appointmentId);

    @Query("SELECT h FROM AppointmentHistory h " +
           "WHERE h.changedByUserId = :userId " +
           "ORDER BY h.changedAt DESC")
    List<AppointmentHistory> findByChangedByUserId(@Param("userId") Long userId);

}
