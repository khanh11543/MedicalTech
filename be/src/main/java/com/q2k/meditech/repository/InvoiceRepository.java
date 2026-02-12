package com.q2k.meditech.repository;

import com.q2k.meditech.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /**
     * Find invoice by invoice number
     */
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    /**
     * Find invoice by payment ID
     */
    @Query("SELECT i FROM Invoice i " +
            "LEFT JOIN FETCH i.payment p " +
            "LEFT JOIN FETCH i.patient pat " +
            "WHERE i.payment.id = :paymentId")
    Optional<Invoice> findByPaymentIdWithDetails(@Param("paymentId") Long paymentId);

    /**
     * Find invoices by patient ID
     */
    List<Invoice> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    /**
     * Find invoice by ID with details
     */
    @Query("SELECT i FROM Invoice i " +
            "LEFT JOIN FETCH i.payment p " +
            "LEFT JOIN FETCH i.patient pat " +
            "WHERE i.id = :id")
    Optional<Invoice> findByIdWithDetails(@Param("id") Long id);

    /**
     * Check if invoice exists for payment
     */
    boolean existsByPaymentId(Long paymentId);
}