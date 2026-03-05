package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment history item for receptionist patient detail view (read-only).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientPaymentHistoryDTO {

    private Long id;
    private String paymentCode;
    private String appointmentCode;
    private String doctorName;

    private BigDecimal amount;
    private BigDecimal totalAmount;
    private String currency;
    private String paymentMethod;
    private String paymentStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paidAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    private Boolean hasReceipt;
    private Long invoiceId;
}
