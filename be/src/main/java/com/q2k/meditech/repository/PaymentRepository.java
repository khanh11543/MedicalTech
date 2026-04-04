package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.PaymentQr;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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
     * Find APPOINTMENT-type payment by appointment ID (excludes prescription payments)
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "WHERE p.appointment.id = :appointmentId " +
            "AND (p.referenceType IS NULL OR p.referenceType = 'APPOINTMENT')")
    Optional<Payment> findByAppointmentIdWithDetails(@Param("appointmentId") Long appointmentId);

    /**
     * Find APPOINTMENT-type payments by a list of appointment IDs (batch lookup).
     * Excludes PRESCRIPTION-type payments to avoid overriding appointment payment data.
     */
    @Query("SELECT p FROM Payment p WHERE p.appointment.id IN :appointmentIds AND (p.referenceType IS NULL OR p.referenceType = 'APPOINTMENT')")
    List<Payment> findByAppointmentIdIn(@Param("appointmentIds") List<Long> appointmentIds);

    /**
     * Find payment by ID with details
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user du " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user pu " +
            "LEFT JOIN FETCH p.processedBy u " +
            "LEFT JOIN FETCH p.prescription pre " +
            "WHERE p.id = :id")
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);

    /**
     * Lock payment row for update (MoMo init / QR) to avoid concurrent duplicate transactions and deadlocks.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);

    /**
     * Find payment by prescription ID (active/non-cancelled)
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.prescription pre " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user pu " +
            "LEFT JOIN FETCH p.processedBy u " +
            "WHERE p.prescription.id = :prescriptionId " +
            "AND p.paymentStatus NOT IN ('CANCELLED', 'FAILED', 'EXPIRED')")
    Optional<Payment> findActivePrescriptionPayment(@Param("prescriptionId") Long prescriptionId);

    /**
     * Find payments by patient ID
     */
    List<Payment> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    /**
     * Find pending MoMo payments for a patient (for status sync)
     */
    List<Payment> findByPatientIdAndPaymentMethodAndPaymentStatusIn(Long patientId, String paymentMethod, List<String> paymentStatuses);

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
    @Query(value = "SELECT DISTINCT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user " +
            "LEFT JOIN FETCH p.processedBy " +
            "WHERE p.patient.id = :patientId " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate) " +
            "ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Payment p " +
            "WHERE p.patient.id = :patientId " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate)")
    Page<Payment> findByPatientIdWithFilters(
            @Param("patientId") Long patientId,
            @Param("status") String status,
            @Param("method") String method,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    /**
     * Find payments by patient ID with multiple payment statuses and optional appointment status filter
     */
    @Query(value = "SELECT DISTINCT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user " +
            "LEFT JOIN FETCH p.processedBy " +
            "WHERE p.patient.id = :patientId " +
            "AND (:statuses IS NULL OR p.paymentStatus IN :statuses) " +
            "AND (:appointmentStatus IS NULL OR a.status = :appointmentStatus) " +
            "AND (:excludeAppointmentStatuses IS NULL OR a IS NULL OR a.status NOT IN :excludeAppointmentStatuses) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate) " +
            "ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Payment p " +
            "LEFT JOIN p.appointment a " +
            "WHERE p.patient.id = :patientId " +
            "AND (:statuses IS NULL OR p.paymentStatus IN :statuses) " +
            "AND (:appointmentStatus IS NULL OR a.status = :appointmentStatus) " +
            "AND (:excludeAppointmentStatuses IS NULL OR a IS NULL OR a.status NOT IN :excludeAppointmentStatuses) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate)")
    Page<Payment> findByPatientIdWithAdvancedFilters(
            @Param("patientId") Long patientId,
            @Param("statuses") java.util.List<String> statuses,
            @Param("appointmentStatus") com.q2k.meditech.entity.enums.AppointmentStatus appointmentStatus,
            @Param("excludeAppointmentStatuses") java.util.List<com.q2k.meditech.entity.enums.AppointmentStatus> excludeAppointmentStatuses,
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

    // ==================== ADVANCED FILTER QUERIES ====================

    /**
     * Find all payments with advanced filters (admin)
     * Includes search, doctorId, minAmount, maxAmount
     */
    @Query(value = "SELECT DISTINCT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user du " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user pu " +
            "LEFT JOIN FETCH p.processedBy pb " +
            "WHERE (:search IS NULL OR :search = '' OR " +
            "       LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(du.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:doctorId IS NULL OR d.id = :doctorId) " +
            "AND (:patientId IS NULL OR p.patient.id = :patientId) " +
            "AND (:minAmount IS NULL OR p.totalAmount >= :minAmount) " +
            "AND (:maxAmount IS NULL OR p.totalAmount <= :maxAmount) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate)",
        countQuery = "SELECT COUNT(DISTINCT p) FROM Payment p " +
            "LEFT JOIN p.appointment a " +
            "LEFT JOIN a.doctor d " +
            "LEFT JOIN d.user du " +
            "LEFT JOIN p.patient pat " +
            "LEFT JOIN pat.user pu " +
            "WHERE (:search IS NULL OR :search = '' OR " +
            "       LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(du.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:doctorId IS NULL OR d.id = :doctorId) " +
            "AND (:patientId IS NULL OR p.patient.id = :patientId) " +
            "AND (:minAmount IS NULL OR p.totalAmount >= :minAmount) " +
            "AND (:maxAmount IS NULL OR p.totalAmount <= :maxAmount) " +
            "AND (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate)")
    Page<Payment> findAllWithAdvancedFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("method") String method,
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("minAmount") java.math.BigDecimal minAmount,
            @Param("maxAmount") java.math.BigDecimal maxAmount,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    // ==================== STATISTICS QUERIES ====================

    /**
     * Count payments by status within date range
     */
    @Query("SELECT p.paymentStatus, COUNT(p) FROM Payment p " +
            "WHERE (:fromDate IS NULL OR p.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.createdAt <= :toDate) " +
            "GROUP BY p.paymentStatus")
    List<Object[]> countByStatusInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Sum total amount by status within date range
     */
    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.paymentStatus = :status " +
            "AND (:fromDate IS NULL OR p.paidAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.paidAt <= :toDate)")
    java.math.BigDecimal sumAmountByStatusInDateRange(
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Count and sum by payment method within date range (for completed payments)
     */
    @Query("SELECT p.paymentMethod, COUNT(p), COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND (:fromDate IS NULL OR p.paidAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.paidAt <= :toDate) " +
            "GROUP BY p.paymentMethod")
    List<Object[]> countAndSumByPaymentMethodInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get pending payments count and amount
     */
    @Query("SELECT COUNT(p), COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.paymentStatus = 'PENDING'")
    Object[] getPendingPaymentsStats();

    /**
     * Get refund statistics for date range
     */
    @Query("SELECT COUNT(p), COALESCE(SUM(p.refundAmount), 0) FROM Payment p " +
            "WHERE p.paymentStatus = 'REFUNDED' " +
            "AND (:fromDate IS NULL OR p.refundedAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.refundedAt <= :toDate)")
    Object[] getRefundStatsInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Count total completed transactions in date range
     */
    @Query("SELECT COUNT(p) FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND (:fromDate IS NULL OR p.paidAt >= :fromDate) " +
            "AND (:toDate IS NULL OR p.paidAt <= :toDate)")
    Long countCompletedInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Find payments by IDs
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "WHERE p.id IN :ids")
    List<Payment> findByIdIn(@Param("ids") List<Long> ids);

    // ==================== REVENUE ANALYTICS QUERIES ====================

    /**
     * Get total revenue and transaction count in date range
     */
    @Query("SELECT COUNT(p), COALESCE(SUM(p.totalAmount), 0), COALESCE(AVG(p.totalAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate")
    Object[] getRevenueSummary(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get revenue by doctor
     */
    @Query("SELECT d.id, du.fullName, d.specialization, " +
            "COUNT(p), COALESCE(SUM(p.totalAmount), 0), COALESCE(AVG(p.totalAmount), 0) " +
            "FROM Payment p " +
            "JOIN p.appointment a " +
            "JOIN a.doctor d " +
            "JOIN d.user du " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "GROUP BY d.id, du.fullName, d.specialization " +
            "ORDER BY SUM(p.totalAmount) DESC")
    List<Object[]> getRevenueByDoctor(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get refund amount by doctor
     */
    @Query("SELECT d.id, COUNT(p), COALESCE(SUM(p.refundAmount), 0) " +
            "FROM Payment p " +
            "JOIN p.appointment a " +
            "JOIN a.doctor d " +
            "WHERE p.paymentStatus = 'REFUNDED' " +
            "AND p.refundedAt >= :fromDate AND p.refundedAt <= :toDate " +
            "GROUP BY d.id")
    List<Object[]> getRefundByDoctor(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get revenue by payment method with success/fail counts
     */
    @Query("SELECT p.paymentMethod, p.paymentStatus, COUNT(p), COALESCE(SUM(p.totalAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.createdAt >= :fromDate AND p.createdAt <= :toDate " +
            "GROUP BY p.paymentMethod, p.paymentStatus")
    List<Object[]> getRevenueByMethodWithStatus(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get daily revenue for chart
     */
    @Query("SELECT FUNCTION('DATE', p.paidAt), COUNT(p), COALESCE(SUM(p.totalAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "AND (:doctorId IS NULL OR p.appointment.doctor.id = :doctorId) " +
            "GROUP BY FUNCTION('DATE', p.paidAt) " +
            "ORDER BY FUNCTION('DATE', p.paidAt)")
    List<Object[]> getDailyRevenue(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("doctorId") Long doctorId
    );

    /**
     * Get daily refund amounts
     */
    @Query("SELECT FUNCTION('DATE', p.refundedAt), COUNT(p), COALESCE(SUM(p.refundAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.paymentStatus = 'REFUNDED' " +
            "AND p.refundedAt >= :fromDate AND p.refundedAt <= :toDate " +
            "AND (:doctorId IS NULL OR p.appointment.doctor.id = :doctorId) " +
            "GROUP BY FUNCTION('DATE', p.refundedAt)")
    List<Object[]> getDailyRefunds(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("doctorId") Long doctorId
    );

    /**
     * Get peak revenue day
     */
    @Query("SELECT FUNCTION('DATE', p.paidAt), COALESCE(SUM(p.totalAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "GROUP BY FUNCTION('DATE', p.paidAt) " +
            "ORDER BY SUM(p.totalAmount) DESC")
    List<Object[]> getPeakRevenueDay(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get appointment count by doctor in date range
     */
    @Query("SELECT d.id, " +
            "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) " +
            "FROM Appointment a " +
            "JOIN a.doctor d " +
            "WHERE a.appointmentDate >= :fromDate AND a.appointmentDate <= :toDate " +
            "GROUP BY d.id")
    List<Object[]> getAppointmentCountByDoctor(
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate") java.time.LocalDate toDate
    );

    /**
     * Get revenue by appointment reason (type)
     */
    @Query("SELECT a.reasonForVisit, COUNT(p), COALESCE(SUM(p.totalAmount), 0), COALESCE(AVG(p.totalAmount), 0) " +
            "FROM Payment p " +
            "JOIN p.appointment a " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "GROUP BY a.reasonForVisit")
    List<Object[]> getRevenueByAppointmentType(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    /**
     * Get appointment status count by reason
     */
    @Query("SELECT a.reasonForVisit, a.status, COUNT(a) " +
            "FROM Appointment a " +
            "WHERE a.appointmentDate >= :fromDate AND a.appointmentDate <= :toDate " +
            "GROUP BY a.reasonForVisit, a.status")
    List<Object[]> getAppointmentStatusByType(
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate") java.time.LocalDate toDate
    );

    // ==================== RECEPTIONIST PENDING PAYMENTS ====================

    /**
     * Find pending payments where appointment is COMPLETED but payment is PENDING
     * Ordered by oldest first (completed_at ASC)
     */
    @Query(value = "SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH a.doctor d " +
            "LEFT JOIN FETCH d.user du " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user pu " +
            "LEFT JOIN FETCH p.processedBy pb " +
            "WHERE p.paymentStatus = 'PENDING' " +
            "AND (:search IS NULL OR :search = '' OR " +
            "       LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :search, '%')))",
        countQuery = "SELECT COUNT(p) FROM Payment p " +
            "LEFT JOIN p.appointment a " +
            "LEFT JOIN p.patient pat " +
            "LEFT JOIN pat.user pu " +
            "WHERE p.paymentStatus = 'PENDING' " +
            "AND (:search IS NULL OR :search = '' OR " +
            "       LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(pu.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "       LOWER(a.appointmentCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Payment> findPendingPayments(
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Count pending payments (appointment COMPLETED + payment PENDING)
     */
    @Query("SELECT COUNT(p), COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "JOIN p.appointment a " +
            "WHERE p.paymentStatus = 'PENDING' " +
            "AND a.status = com.q2k.meditech.entity.enums.AppointmentStatus.COMPLETED")
    Object[] countPendingPaymentsWithCompletedAppointment();

    // ==================== HOURLY REVENUE ====================

    /**
     * Get hourly revenue for a specific date (for chart)
     */
    @Query("SELECT FUNCTION('HOUR', p.paidAt), p.paymentMethod, COUNT(p), COALESCE(SUM(p.totalAmount), 0) " +
            "FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "GROUP BY FUNCTION('HOUR', p.paidAt), p.paymentMethod " +
            "ORDER BY FUNCTION('HOUR', p.paidAt)")
    List<Object[]> getHourlyRevenue(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    // ==================== END OF DAY REPORT ====================

    /**
     * Get all PAID transactions for a specific date (for end-of-day report)
     */
    @Query("SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.appointment a " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user pu " +
            "LEFT JOIN FETCH p.processedBy u " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "ORDER BY p.paidAt ASC")
    List<Payment> findPaidPaymentsForDate(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );

    // ========== SCHEDULER QUERIES ==========

    /**
     * Find all PENDING payments linked to COMPLETED appointments (for scheduler)
     */
    @Query("SELECT p FROM Payment p " +
            "JOIN FETCH p.appointment a " +
            "JOIN FETCH p.patient pat " +
            "JOIN FETCH pat.user u " +
            "WHERE p.paymentStatus = 'PENDING' " +
            "AND a.status = com.q2k.meditech.entity.enums.AppointmentStatus.COMPLETED " +
            "ORDER BY p.createdAt ASC")
    List<Payment> findAllPendingWithCompletedAppointments();

    // ========== DRILL-DOWN QUERY (Revenue Analytics) ==========

    /**
     * Find payments for drill-down with optional filters (date, method, doctor, appointmentType)
     */
    @Query(value = "SELECT p FROM Payment p " +
            "LEFT JOIN FETCH p.patient pat LEFT JOIN FETCH pat.user patUser " +
            "LEFT JOIN FETCH p.appointment app LEFT JOIN FETCH app.doctor doc LEFT JOIN FETCH doc.user docUser " +
            "WHERE p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "AND p.paymentStatus = 'PAID' " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:doctorId IS NULL OR doc.id = :doctorId) " +
            "AND (:appointmentType IS NULL OR app.reasonForVisit = :appointmentType) " +
            "ORDER BY p.paidAt DESC",
            countQuery = "SELECT COUNT(p) FROM Payment p " +
            "LEFT JOIN p.appointment app LEFT JOIN app.doctor doc " +
            "WHERE p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "AND p.paymentStatus = 'PAID' " +
            "AND (:method IS NULL OR p.paymentMethod = :method) " +
            "AND (:doctorId IS NULL OR doc.id = :doctorId) " +
            "AND (:appointmentType IS NULL OR app.reasonForVisit = :appointmentType)")
    Page<Payment> findForDrillDown(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("method") String method,
            @Param("doctorId") Long doctorId,
            @Param("appointmentType") String appointmentType,
            Pageable pageable);

    /**
     * Count PAID payments per day in date range (for refund rate trend)
     */
    @Query("SELECT FUNCTION('DATE', p.paidAt), COUNT(p) FROM Payment p " +
            "WHERE p.paymentStatus = 'PAID' " +
            "AND p.paidAt >= :fromDate AND p.paidAt <= :toDate " +
            "GROUP BY FUNCTION('DATE', p.paidAt) " +
            "ORDER BY FUNCTION('DATE', p.paidAt)")
    List<Object[]> countPaidPerDayInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}