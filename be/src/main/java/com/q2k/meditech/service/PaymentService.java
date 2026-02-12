package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;

/**
 * Payment Service Interface
 */
public interface PaymentService {

    /**
     * Create payment request for an appointment
     * @param dto Payment creation data
     * @param currentUserId User creating the payment
     * @return Created payment
     */
    PaymentDTO createPayment(PaymentCreateDTO dto, Long currentUserId);

    /**
     * Initialize MoMo payment (create order and get pay URL)
     * @param paymentId Payment ID
     * @param dto MoMo init parameters
     * @param currentUserId User initializing
     * @return Payment init result with pay URL
     */
    PaymentInitDTO initMomoPayment(Long paymentId, MomoInitDTO dto, Long currentUserId);

    /**
     * Get QR code for payment (MoMo only)
     * @param paymentId Payment ID
     * @param currentUserId User requesting
     * @return QR code data
     */
    PaymentQrDTO getPaymentQr(Long paymentId, Long currentUserId);

    /**
     * Refresh QR code (re-init if expired)
     * @param paymentId Payment ID
     * @param currentUserId User refreshing
     * @return New payment init result
     */
    PaymentInitDTO refreshQr(Long paymentId, Long currentUserId);

    /**
     * Mark payment as paid with cash
     * @param paymentId Payment ID
     * @param dto Mark cash data
     * @param currentUserId User processing
     * @return Updated payment
     */
    PaymentDTO markPaidCash(Long paymentId, MarkCashDTO dto, Long currentUserId);

    /**
     * Cancel payment request
     * @param paymentId Payment ID
     * @param dto Cancel data
     * @param currentUserId User cancelling
     * @return Updated payment
     */
    PaymentDTO cancelPayment(Long paymentId, CancelPaymentDTO dto, Long currentUserId);

    /**
     * Handle MoMo webhook callback
     * @param webhookDto MoMo webhook data
     * @return Updated payment
     */
    PaymentDTO handleMomoWebhook(MomoWebhookDTO webhookDto);

    /**
     * Handle mock webhook (for testing)
     * @param mockDto Mock webhook data
     * @return Updated payment
     */
    PaymentDTO handleMockWebhook(WebhookMockDTO mockDto);

    /**
     * Get payment by ID
     * @param paymentId Payment ID
     * @return Payment data
     */
    PaymentDTO getPaymentById(Long paymentId);

    /**
     * Get patient's payments with pagination and filters
     * @param patientId Patient ID
     * @param status Filter by status (optional)
     * @param method Filter by payment method (optional)
     * @param from From date (optional, yyyy-MM-dd)
     * @param to To date (optional, yyyy-MM-dd)
     * @param pageNumber Page number (0-based)
     * @param pageSize Page size
     * @return Page of payments
     */
    org.springframework.data.domain.Page<PaymentDTO> getMyPayments(
            Long patientId,
            String status,
            String method,
            String from,
            String to,
            int pageNumber,
            int pageSize
    );

    /**
     * Get payment by ID with ownership check
     * @param paymentId Payment ID
     * @param patientId Patient ID (for ownership check)
     * @return Payment data
     */
    PaymentDTO getPaymentByIdForPatient(Long paymentId, Long patientId);

    /**
     * Get payment QR with ownership check
     * @param paymentId Payment ID
     * @param patientId Patient ID (for ownership check)
     * @return QR code data
     */
    PaymentQrDTO getPaymentQrForPatient(Long paymentId, Long patientId);

    // ========== ADMIN METHODS ==========

    /**
     * List all payments with filters (admin)
     * @param status Filter by status (optional)
     * @param method Filter by payment method (optional)
     * @param from From date (optional, yyyy-MM-dd)
     * @param to To date (optional, yyyy-MM-dd)
     * @param patientId Filter by patient ID (optional)
     * @param appointmentId Filter by appointment ID (optional)
     * @param pageNumber Page number (0-based)
     * @param pageSize Page size
     * @return Page of payments
     */
    org.springframework.data.domain.Page<PaymentDTO> getAllPayments(
            String status,
            String method,
            String from,
            String to,
            Long patientId,
            Long appointmentId,
            int pageNumber,
            int pageSize
    );

    /**
     * Refund payment (cash or MoMo)
     * @param paymentId Payment ID
     * @param dto Refund parameters
     * @param currentUserId User processing refund
     * @return Updated payment
     */
    PaymentDTO refundPayment(Long paymentId, RefundDTO dto, Long currentUserId);

    /**
     * Cancel payment (admin can cancel any payment)
     * @param paymentId Payment ID
     * @param dto Cancel data
     * @param currentUserId User cancelling
     * @return Updated payment
     */
    PaymentDTO adminCancelPayment(Long paymentId, CancelPaymentDTO dto, Long currentUserId);

    /**
     * Expire pending/initiated payments (scheduled job)
     * @param dto Expiry parameters
     * @return Expiry result
     */
    ExpirePaymentsResultDTO expirePayments(ExpirePaymentsDTO dto);

    /**
     * Reconcile MoMo payment status
     * @param paymentId Payment ID
     * @param currentUserId User initiating reconciliation
     * @return Updated payment
     */
    PaymentDTO reconcileMomoStatus(Long paymentId, Long currentUserId);
}