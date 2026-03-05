package com.q2k.meditech.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO for sending payment receipt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendReceiptDTO {

    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Builder.Default
    private Boolean includePDF = true;

    private String customMessage;
}
