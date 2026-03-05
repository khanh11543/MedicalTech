package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/**
 * DTO for bulk marking payments as paid
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkMarkPaidDTO {

    @NotEmpty(message = "Payment IDs are required")
    private List<Long> paymentIds;

    @NotNull(message = "Payment method is required")
    private String paymentMethod;

    private String transactionReference;

    private String notes;

    @Builder.Default
    private Boolean sendReceipts = true;
}
