package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for manually marking payment as paid
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkPaidDTO {

    @NotNull(message = "Payment method is required")
    private String paymentMethod; // CASH, CARD, BANK_TRANSFER, etc.

    private String transactionReference; // External transaction reference

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paidDate; // Default: now

    private String notes;

    @Builder.Default
    private Boolean sendReceipt = true;
}
