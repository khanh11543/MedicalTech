package com.q2k.meditech.repository;

import com.q2k.meditech.entity.PaymentQr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentQrRepository extends JpaRepository<PaymentQr, Long> {

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
     * Find expired QR codes by expiry time
     */
    @Query("SELECT pq FROM PaymentQr pq " +
            "WHERE pq.status = 'ACTIVE' " +
            "AND pq.expiresAt < :expiryTime")
    java.util.List<PaymentQr> findExpiredQrs(@Param("expiryTime") java.time.LocalDateTime expiryTime);

    /**
     * Delete all QRs for a payment
     */
    void deleteByPaymentId(Long paymentId);
}