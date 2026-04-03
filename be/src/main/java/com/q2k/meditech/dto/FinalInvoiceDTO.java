package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Final Invoice — aggregates ALL costs from a single appointment visit:
 * consultation fee, service orders (lab/imaging), and prescription medications.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalInvoiceDTO {

    private Long appointmentId;
    private String appointmentCode;

    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    private String doctorName;
    private String doctorSpecialty;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate invoiceDate;

    private String invoiceNumber;

    // Grouped line items
    private List<FinalInvoiceItemDTO> consultationItems;
    private List<FinalInvoiceItemDTO> serviceItems;
    private List<FinalInvoiceItemDTO> medicationItems;

    // Totals per section
    private BigDecimal consultationTotal;
    private BigDecimal servicesTotal;
    private BigDecimal medicationsTotal;

    // Grand totals
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal grandTotal;

    // Payment summary
    private String paymentStatus; // ALL_PAID, PARTIALLY_PAID, UNPAID
    private boolean invoiceReady; // true when all applicable payments are PAID

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
