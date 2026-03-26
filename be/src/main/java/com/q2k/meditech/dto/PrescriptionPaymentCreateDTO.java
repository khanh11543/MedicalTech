package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionPaymentCreateDTO {

    @NotNull(message = "Prescription ID is required")
    private Long prescriptionId;

    @NotNull(message = "Payment method is required")
    @Pattern(regexp = "^(CASH|MOMO)$", message = "Payment method must be CASH or MOMO")
    private String paymentMethod;

    private BigDecimal discountAmount;

    private BigDecimal taxAmount;

    private String notes;
}
