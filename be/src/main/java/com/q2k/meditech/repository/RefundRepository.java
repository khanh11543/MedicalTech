package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Refund;
import com.q2k.meditech.entity.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Refund entity
 */
@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    // ===================== Basic Lookups =====================

    Optional<Refund> findByRefundCode(String refundCode);

    Optional<Refund> findByPaymentId(Long paymentId);

    List<Refund> findAllByPaymentIdOrderByRequestedDateDesc(Long paymentId);

    // ===================== Detail Fetch =====================

    @Query("SELECT r FROM Refund r " +
            "LEFT JOIN FETCH r.payment p " +
            "LEFT JOIN FETCH p.patient pat " +
            "LEFT JOIN FETCH pat.user patUser " +
            "LEFT JOIN FETCH p.appointment app " +
            "LEFT JOIN FETCH app.doctor doc " +
            "LEFT JOIN FETCH doc.user docUser " +
            "LEFT JOIN FETCH r.requestedBy rb " +
            "LEFT JOIN FETCH r.approvedBy ab " +
            "LEFT JOIN FETCH r.processedBy pb " +
            "LEFT JOIN FETCH r.rejectedBy rejb " +
            "WHERE r.id = :id")
    Optional<Refund> findByIdWithDetails(@Param("id") Long id);

    // ===================== Advanced Filters =====================

    @Query("SELECT r FROM Refund r " +
            "LEFT JOIN r.payment p " +
            "LEFT JOIN p.patient pat " +
            "LEFT JOIN pat.user patUser " +
            "LEFT JOIN p.appointment app " +
            "LEFT JOIN app.doctor doc " +
            "WHERE (:status IS NULL OR r.status = :status) " +
            "AND (:doctorId IS NULL OR doc.id = :doctorId) " +
            "AND (:patientId IS NULL OR pat.id = :patientId) " +
            "AND (:refundMethod IS NULL OR r.refundMethod = :refundMethod) " +
            "AND (:refundReasonType IS NULL OR r.refundReasonType = :refundReasonType) " +
            "AND (:searchTerm IS NULL OR LOWER(patUser.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "     OR LOWER(r.refundCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "     OR LOWER(p.paymentCode) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate) " +
            "AND (:minAmount IS NULL OR r.refundAmount >= :minAmount) " +
            "AND (:maxAmount IS NULL OR r.refundAmount <= :maxAmount)")
    Page<Refund> findAllWithFilters(
            @Param("status") RefundStatus status,
            @Param("doctorId") Long doctorId,
            @Param("patientId") Long patientId,
            @Param("refundMethod") com.q2k.meditech.entity.enums.RefundMethod refundMethod,
            @Param("refundReasonType") com.q2k.meditech.entity.enums.RefundReason refundReasonType,
            @Param("searchTerm") String searchTerm,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable);

    // ===================== Count / Sum by Status =====================

    Long countByStatus(RefundStatus status);

    @Query("SELECT COUNT(r) FROM Refund r " +
            "WHERE r.status = :status " +
            "AND (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate)")
    Long countByStatusInDateRange(
            @Param("status") RefundStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r WHERE r.status = :status")
    BigDecimal sumRefundAmountByStatus(@Param("status") RefundStatus status);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
            "WHERE r.status = :status " +
            "AND (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate)")
    BigDecimal sumRefundAmountByStatusInDateRange(
            @Param("status") RefundStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(r) FROM Refund r " +
            "WHERE (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate)")
    Long countInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
            "WHERE (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate)")
    BigDecimal sumRefundAmountInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    // ===================== By Payment Method =====================

    @Query("SELECT p.paymentMethod, COUNT(r), COALESCE(SUM(r.refundAmount), 0) " +
            "FROM Refund r JOIN r.payment p " +
            "WHERE (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate) " +
            "GROUP BY p.paymentMethod")
    List<Object[]> countAndSumByPaymentMethodInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    // ===================== Average Processing Time =====================

    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, r.requestedDate, r.processedDate)) " +
            "FROM Refund r " +
            "WHERE r.status = 'COMPLETED' " +
            "AND r.processedDate IS NOT NULL " +
            "AND (:fromDate IS NULL OR r.requestedDate >= :fromDate) " +
            "AND (:toDate IS NULL OR r.requestedDate <= :toDate)")
    Double calculateAverageProcessingTimeInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    // ===================== Pending / Duplicate Checks =====================

    @Query("SELECT COUNT(r) > 0 FROM Refund r " +
            "WHERE r.payment.id = :paymentId " +
            "AND r.status IN ('REQUESTED', 'APPROVED', 'PENDING', 'PROCESSING')")
    boolean existsPendingRefundForPayment(@Param("paymentId") Long paymentId);

    /**
     * Sum total already-refunded amount for a payment (COMPLETED only)
     */
    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
            "WHERE r.payment.id = :paymentId " +
            "AND r.status = 'COMPLETED'")
    BigDecimal sumCompletedRefundAmountByPaymentId(@Param("paymentId") Long paymentId);

    /**
     * Sum refund amount in active states (REQUESTED/APPROVED/PROCESSING) for a payment
     */
    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
            "WHERE r.payment.id = :paymentId " +
            "AND r.status IN ('REQUESTED', 'APPROVED', 'PROCESSING')")
    BigDecimal sumActiveRefundAmountByPaymentId(@Param("paymentId") Long paymentId);

    // ===================== Code Generation =====================

    @Query("SELECT MAX(r.refundCode) FROM Refund r WHERE r.refundCode LIKE :prefix%")
    String findMaxRefundCodeByPrefix(@Param("prefix") String prefix);

    // ===================== Urgent / Overdue =====================

    /**
     * Find refunds that are overdue (REQUESTED/APPROVED for more than X days)
     */
    @Query("SELECT r FROM Refund r " +
            "WHERE r.status IN ('REQUESTED', 'APPROVED') " +
            "AND r.requestedDate < :thresholdDate " +
            "ORDER BY r.requestedDate ASC")
    List<Refund> findOverdueRefunds(@Param("thresholdDate") LocalDateTime thresholdDate);

    /**
     * Find FAILED refunds that can still be retried
     */
    @Query("SELECT r FROM Refund r " +
            "WHERE r.status = 'FAILED' " +
            "AND r.retryCount < r.maxRetries " +
            "ORDER BY r.updatedAt ASC")
    List<Refund> findRetryableRefunds();

    // ===================== Revenue Analytics =====================

    @Query("SELECT r.refundReason, COUNT(r), COALESCE(SUM(r.refundAmount), 0) " +
            "FROM Refund r " +
            "WHERE r.status = com.q2k.meditech.entity.enums.RefundStatus.COMPLETED " +
            "AND r.processedDate >= :fromDate AND r.processedDate <= :toDate " +
            "GROUP BY r.refundReason " +
            "ORDER BY SUM(r.refundAmount) DESC")
    List<Object[]> getRefundByReasonInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT FUNCTION('DATE', r.processedDate), COUNT(r), COALESCE(SUM(r.refundAmount), 0) " +
            "FROM Refund r " +
            "WHERE r.status = com.q2k.meditech.entity.enums.RefundStatus.COMPLETED " +
            "AND r.processedDate >= :fromDate AND r.processedDate <= :toDate " +
            "GROUP BY FUNCTION('DATE', r.processedDate) " +
            "ORDER BY FUNCTION('DATE', r.processedDate)")
    List<Object[]> getDailyRefundTrend(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(r) FROM Refund r " +
            "WHERE r.status = com.q2k.meditech.entity.enums.RefundStatus.COMPLETED " +
            "AND r.processedDate >= :fromDate AND r.processedDate <= :toDate")
    Long countCompletedInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
            "WHERE r.status = com.q2k.meditech.entity.enums.RefundStatus.COMPLETED " +
            "AND r.processedDate >= :fromDate AND r.processedDate <= :toDate")
    BigDecimal sumCompletedRefundAmountInDateRange(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}
