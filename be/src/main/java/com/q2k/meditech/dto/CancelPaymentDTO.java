package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for cancelling a payment request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelPaymentDTO {
    
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason; // Optional cancel reason

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes; // Optional additional notes
}