package com.q2k.meditech.repository;

import com.q2k.meditech.entity.DeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, Long> {

    /**
     * Find delivery logs by payment ID
     */
    @Query("SELECT dl FROM DeliveryLog dl " +
            "LEFT JOIN FETCH dl.sentBy u " +
            "WHERE dl.payment.id = :paymentId " +
            "ORDER BY dl.createdAt DESC")
    List<DeliveryLog> findByPaymentIdWithDetails(@Param("paymentId") Long paymentId);

    /**
     * Find delivery logs by payment ID and type
     */
    List<DeliveryLog> findByPaymentIdAndDeliveryTypeOrderByCreatedAtDesc(Long paymentId, String deliveryType);

    /**
     * Count successful deliveries by payment ID
     */
    @Query("SELECT COUNT(dl) FROM DeliveryLog dl " +
            "WHERE dl.payment.id = :paymentId " +
            "AND dl.status = 'SENT'")
    long countSuccessfulDeliveriesByPaymentId(@Param("paymentId") Long paymentId);
}