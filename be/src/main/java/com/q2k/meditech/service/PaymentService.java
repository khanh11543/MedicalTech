package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.EndOfDayReportDTO;
import com.q2k.meditech.dto.receptionist.HourlyRevenueDTO;
import com.q2k.meditech.dto.receptionist.PendingPaymentDTO;
import com.q2k.meditech.dto.receptionist.SendPaymentLinkDTO;

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
     * Create a PENDING payment for an appointment (e.g. when patient books).
     * If a payment already exists for the appointment, returns it. No payment method required.
     * @param appointmentId Appointment ID
     * @param processedByUserId User who triggered (e.g. patient who booked)
     * @return Created or existing payment
     */
    PaymentDTO createPaymentForAppointment(Long appointmentId, Long processedByUserId);

    /**
     * Create payment request for a prescription
     * @param dto Prescription payment creation data
     * @param currentUserId User creating the payment
     * @return Created payment
     */
    PaymentDTO createPrescriptionPayment(PrescriptionPaymentCreateDTO dto, Long currentUserId);

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
     * Create a PENDING payment for service orders and initialize MoMo QR payment
     * @param appointmentId Appointment ID
     * @param serviceOrderIds List of service order IDs to pay
     * @param currentUserId User initializing the payment
     * @return Payment init result with QR code URL
     */
    PaymentInitDTO createAndInitMomoForServiceOrders(Long appointmentId, java.util.List<Long> serviceOrderIds, Long currentUserId);

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

    /**
     * Patient initiates MoMo payment (with ownership check)
     */
    PaymentInitDTO initMomoPaymentForPatient(Long paymentId, Long patientId);

    /**
     * Patient cancels own PENDING payment (with ownership check)
     */
    PaymentDTO cancelPaymentForPatient(Long paymentId, Long patientId, String reason);

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

    // ========== ADVANCED ADMIN METHODS ==========

    /**
     * List all payments with advanced filters (admin)
     * @param search Search by transaction code, patient name, appointment code
     * @param status Filter by status (optional)
     * @param method Filter by payment method (optional)
     * @param doctorId Filter by doctor ID (optional)
     * @param patientId Filter by patient ID (optional)
     * @param minAmount Minimum amount filter (optional)
     * @param maxAmount Maximum amount filter (optional)
     * @param from From date (optional, yyyy-MM-dd)
     * @param to To date (optional, yyyy-MM-dd)
     * @param pageNumber Page number (0-based)
     * @param pageSize Page size
     * @param sortBy Sort field (default: paymentDate)
     * @param sortDir Sort direction (default: DESC)
     * @return Page of payments
     */
    org.springframework.data.domain.Page<PaymentDTO> getAllPaymentsAdvanced(
            String search,
            String status,
            String method,
            Long doctorId,
            Long patientId,
            java.math.BigDecimal minAmount,
            java.math.BigDecimal maxAmount,
            String from,
            String to,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortDir
    );

    /**
     * Get payment statistics for dashboard
     * @param from From date (optional, yyyy-MM-dd)
     * @param to To date (optional, yyyy-MM-dd)
     * @return Payment statistics
     */
    PaymentStatsDTO getPaymentStatistics(String from, String to);

    /**
     * Bulk mark payments as paid
     * @param dto Bulk mark paid data
     * @param currentUserId User processing
     * @return Bulk action result
     */
    PaymentBulkResultDTO bulkMarkAsPaid(BulkMarkPaidDTO dto, Long currentUserId);

    /**
     * Export payments to file
     * @param search Search filter
     * @param status Status filter
     * @param method Payment method filter
     * @param doctorId Doctor ID filter
     * @param patientId Patient ID filter
     * @param minAmount Minimum amount filter
     * @param maxAmount Maximum amount filter
     * @param from From date filter
     * @param to To date filter
     * @param format Export format (EXCEL, CSV, PDF)
     * @return File bytes
     */
    byte[] exportPayments(
            String search,
            String status,
            String method,
            Long doctorId,
            Long patientId,
            java.math.BigDecimal minAmount,
            java.math.BigDecimal maxAmount,
            String from,
            String to,
            String format
    );

    // ========== PAYMENT DETAIL & ACTIONS APIs ==========

    /**
     * Get comprehensive payment details (admin)
     * @param paymentId Payment ID
     * @return Payment detail with all related info
     */
    PaymentDetailDTO getPaymentDetail(Long paymentId);

    /**
     * Mark payment as paid manually (for cash/offline payments)
     * @param paymentId Payment ID
     * @param dto Mark paid data
     * @param currentUserId User processing
     * @return Updated payment
     */
    PaymentDTO markAsPaid(Long paymentId, MarkPaidDTO dto, Long currentUserId);

    /**
     * Retry payment - resend payment link to patient
     * @param paymentId Payment ID
     * @param dto Retry data containing send method
     * @param currentUserId User initiating retry
     * @return Message result
     */
    MessageDTO retryPayment(Long paymentId, RetryPaymentDTO dto, Long currentUserId);

    /**
     * Send payment receipt to email
     * @param paymentId Payment ID
     * @param dto Send receipt data
     * @param currentUserId User sending receipt
     * @return Message result
     */
    MessageDTO sendReceipt(Long paymentId, SendReceiptDTO dto, Long currentUserId);

    /**
     * Generate and get receipt PDF as bytes
     * @param paymentId Payment ID
     * @return PDF bytes
     */
    byte[] downloadReceipt(Long paymentId);

    /**
     * Get payment history/timeline
     * @param paymentId Payment ID
     * @return Payment history with events
     */
    PaymentHistoryDTO getPaymentHistory(Long paymentId);

    // ========== RECEPTIONIST TAB 5 — NEW METHODS ==========

    /**
     * Get pending payments list (appointment COMPLETED + payment PENDING)
     * Tab 5.3 — Pending debts
     */
    org.springframework.data.domain.Page<PendingPaymentDTO> getPendingPayments(
            String search, int pageNumber, int pageSize, String sortBy, String sortDir);

    /**
     * Send MoMo payment link to patient via SMS/email
     * Tab 5.3 — Pending actions
     */
    MessageDTO sendPaymentLink(Long paymentId, SendPaymentLinkDTO dto, Long currentUserId);

    /**
     * Get hourly revenue data for today (for chart)
     * Tab 5.4 — Today's Revenue
     */
    HourlyRevenueDTO getHourlyRevenue(String date);

    /**
     * Generate end-of-day report
     * Tab 5.4 — Today's Revenue
     */
    EndOfDayReportDTO generateEndOfDayReport(String date, Long currentUserId);

    /**
     * Export end-of-day report as PDF or Excel bytes
     */
    byte[] exportEndOfDayReport(String date, String format, Long currentUserId);
}