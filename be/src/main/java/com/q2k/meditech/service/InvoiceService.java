package com.q2k.meditech.service;

import com.q2k.meditech.dto.InvoiceDTO;
import com.q2k.meditech.dto.InvoiceUpdateDTO;

/**
 * Invoice Service Interface
 */
public interface InvoiceService {

    /**
     * Create invoice for a payment
     * @param paymentId Payment ID
     * @return Created invoice
     */
    InvoiceDTO createInvoiceForPayment(Long paymentId);

    /**
     * Get invoice by payment ID
     * @param paymentId Payment ID
     * @return Invoice
     */
    InvoiceDTO getInvoiceByPaymentId(Long paymentId);

    /**
     * Get invoice by ID
     * @param invoiceId Invoice ID
     * @return Invoice
     */
    InvoiceDTO getInvoiceById(Long invoiceId);

    /**
     * Get invoice by payment ID with ownership check
     * @param paymentId Payment ID
     * @param patientId Patient ID (for ownership check)
     * @return Invoice
     */
    InvoiceDTO getInvoiceByPaymentIdForPatient(Long paymentId, Long patientId);

    /**
     * Get invoice by ID with ownership check
     * @param invoiceId Invoice ID
     * @param patientId Patient ID (for ownership check)
     * @return Invoice
     */
    InvoiceDTO getInvoiceByIdForPatient(Long invoiceId, Long patientId);
    // ========== ADMIN METHODS ==========

    /**
     * Update invoice information (admin)
     * @param invoiceId Invoice ID
     * @param dto Update data
     * @param currentUserId User updating
     * @return Updated invoice
     */
    InvoiceDTO updateInvoice(Long invoiceId, InvoiceUpdateDTO dto, Long currentUserId);
}