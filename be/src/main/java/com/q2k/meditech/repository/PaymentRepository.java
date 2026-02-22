package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.PaymentQr;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Find payment by payment code
     */
    Optional<Payment> findByPaymentCode(String paymentCode);

    /**
     * Find payment by appointment ID
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "WHERE p.appointment.id = :appointmentId")
    Optional<Payment> findByAppointmentIdWithDetails(@Param("appointmentId") Long appointmentId);

    /**
     * Find payment by ID with details
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH p.processedBy u " +
            "WHERE p.id = :id")
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);

    /**
     * Find payments by patient ID
     */
    List<Payment> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    /**
     * Find payments by status
     */
    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);

    /**
     * Check if appointment already has payment
     */
    boolean existsByAppointmentId(Long appointmentId);


    /**
     * Find payment by transaction ID (from gateway)
     */
    Optional<Payment> findByTransactionId(String transactionId);

    /**
     * Find payments by patient ID with pagination and filters
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "WHERE p.patient.id = :patientId " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate) " +
            "ORDER BY p.createdAt DESC")
    Page<Payment> findByPatientIdWithFilters(
            @Param("patientId") Long patientId,
            @Param("status") String status,
            @Param("method") String method,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
    /**
     * Find all payments with filters (admin)
     */
    @Query("SELECT DISTINCT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user " +
            "LEFT JOIN FETCH p.processedBy " +
            "WHERE (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:patientId IS NULL OR p.patient.id = :patientId) " +
            "AND (:appointmentId IS NULL OR p.appointment.id = :appointmentId) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate) " +
            "ORDER BY p.createdAt DESC")
    Page<Payment> findAllWithFilters(
            @Param("status") String status,
            @Param("method") String method,
            @Param("patientId") Long patientId,
            @Param("appointmentId") Long appointmentId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
    /**
     * Find payments that need to be expired (PENDING or INITIATED status, created before cutoff time)
     */
    @Query("SELECT p FROM Payment p " +
            "WHERE p.paymentStatus IN ('PENDING', 'INITIATED') " +
            "AND p.createdAt < :cutoffTime")
    List<Payment> findPaymentsToExpire(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Find payments by status and created before cutoff time
     */
    @Query("SELECT p FROM Payment p " +
            "WHERE p.paymentStatus = :status " +
            "AND p.createdAt < :cutoffTime")
    List<Payment> findByStatusAndCreatedBefore(
            @Param("status") String status,
            @Param("cutoffTime") LocalDateTime cutoffTime
    );
    /**
     * Find QR by payment ID
     */
    @Query("SELECT pq FROM PaymentQr pq " +
            "WHERE pq.payment.id = :paymentId " +
            "ORDER BY pq.createdAt DESC")
    Optional<PaymentQr> findByPaymentId(@Param("paymentId") Long paymentId);

    /**
     * Find active QR by payment ID
     */
    @Query("SELECT pq FROM PaymentQr pq " +
            "WHERE pq.payment.id = :paymentId " +
            "AND pq.status = 'ACTIVE' " +
            "ORDER BY pq.createdAt DESC")
    Optional<PaymentQr> findActiveByPaymentId(@Param("paymentId") Long paymentId);

    /**
     * Find expired QRs (ACTIVE status but past expiry time)
     */
    @Query("SELECT pq FROM PaymentQr pq " +
            "WHERE pq.status = 'ACTIVE' " +
            "AND pq.expiresAt < :now")
    List<PaymentQr> findExpiredQrs(@Param("now") LocalDateTime now);
}