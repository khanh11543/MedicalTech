package com.q2k.meditech.service;

import com.q2k.meditech.dto.DeliveryLogDTO;
import com.q2k.meditech.dto.SendInvoiceDTO;
import com.q2k.meditech.dto.SendInvoiceResultDTO;

import java.util.List;

/**
 * Invoice Delivery Service Interface
 * Handles sending invoices via Email/SMS
 */
public interface InvoiceDeliveryService {

    /**
     * Send invoice via email and/or SMS
     * @param paymentId Payment ID
     * @param dto Send invoice parameters
     * @param currentUserId User initiating the send
     * @return Send result
     */
    SendInvoiceResultDTO sendInvoice(Long paymentId, SendInvoiceDTO dto, Long currentUserId);

    /**
     * Auto-send invoice after payment success (MoMo webhook, mark-cash)
     * Uses patient's email and phone from database
     * @param paymentId Payment ID
     * @return Send result
     */
    SendInvoiceResultDTO autoSendInvoiceOnPaymentSuccess(Long paymentId);

    /**
     * Auto-send refund notification after refund processed
     * @param paymentId Payment ID
     * @return Send result
     */
    SendInvoiceResultDTO autoSendRefundNotification(Long paymentId);

    /**
     * Get delivery logs for a payment
     * @param paymentId Payment ID
     * @return List of delivery logs
     */
    List<DeliveryLogDTO> getDeliveryLogs(Long paymentId);

    /**
     * Generate invoice PDF
     * @param invoiceId Invoice ID
     * @return PDF as byte array
     */
    byte[] generateInvoicePdf(Long invoiceId);
}