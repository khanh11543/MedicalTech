package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for marking payment as paid with cash
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkCashDTO {
    
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
    
    private String transactionId; // Optional manual transaction reference
}