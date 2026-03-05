package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for drill-down transaction details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrillDownTransactionDTO {

    private Long id;
    private String transactionCode;
    private String paymentDate;
    private String patientName;
    private String doctorName;
    private BigDecimal amount;
    private String paymentMethod;
    private String status;
    private String appointmentType;
}
