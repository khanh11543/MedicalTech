package com.q2k.meditech.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending prescription via email with options
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendPrescriptionEmailDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Builder.Default
    private Boolean includePDF = true;

    private String customMessage;

    @Builder.Default
    private Boolean sendCopy = false; // Send copy to doctor

    @Builder.Default
    private Boolean patientRequested = false; // Patient explicitly requested this email
}
