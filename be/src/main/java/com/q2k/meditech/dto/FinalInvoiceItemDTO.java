package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * A single line item in the Final Invoice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalInvoiceItemDTO {

    /** CONSULTATION, SERVICE, MEDICATION */
    private String category;

    private String description;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal totalPrice;

    /** Additional context e.g. service category, medication dosage */
    private String detail;
}
