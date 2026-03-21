package com.q2k.meditech.repository;

import com.q2k.meditech.entity.TimeOffRequest;
import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeOffRequestRepository extends JpaRepository<TimeOffRequest, Long> {

    /** All requests for a doctor, newest first */
    @Query("SELECT t FROM TimeOffRequest t WHERE t.doctor.id = :doctorId ORDER BY t.date DESC, t.createdAt DESC")
    List<TimeOffRequest> findByDoctorId(@Param("doctorId") Long doctorId);

    /** Single request that belongs to a specific doctor (prevents cross-doctor access) */
    @Query("SELECT t FROM TimeOffRequest t WHERE t.id = :id AND t.doctor.id = :doctorId")
    Optional<TimeOffRequest> findByIdAndDoctorId(@Param("id") Long id, @Param("doctorId") Long doctorId);

    /** Find approved requests for a date (for availability blocking) */
    @Query("SELECT t FROM TimeOffRequest t WHERE t.doctor.id = :doctorId AND t.date = :date AND t.status = 'APPROVED'")
    List<TimeOffRequest> findApprovedByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    /** Admin: list all PENDING_REVIEW requests ordered oldest first */
    @Query("SELECT t FROM TimeOffRequest t WHERE t.status = :status ORDER BY t.createdAt ASC")
    List<TimeOffRequest> findByStatus(@Param("status") TimeOffStatus status);

    /** Admin: flexible list with optional filters */
    @Query("SELECT t FROM TimeOffRequest t " +
           "WHERE (:status IS NULL OR t.status = :status) " +
           "AND (:doctorId IS NULL OR t.doctor.id = :doctorId) " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:dateFrom IS NULL OR t.date >= :dateFrom) " +
           "AND (:dateTo IS NULL OR t.date <= :dateTo) " +
           "ORDER BY t.createdAt DESC")
    List<TimeOffRequest> findAllForAdmin(
            @Param("status") TimeOffStatus status,
            @Param("doctorId") Long doctorId,
            @Param("type") TimeOffType type,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo);
}
