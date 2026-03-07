package com.q2k.meditech.dto.doctor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for admin verification decision
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminVerificationDecisionDTO {

    /** APPROVE, REJECT, REQUEST_MORE_DOCUMENTS, SUSPEND, REVOKE */
    @NotBlank(message = "Decision is required")
    private String decision;

    @Size(max = 2000, message = "Reason must not exceed 2000 characters")
    private String reason;

    /** For REQUEST_MORE_DOCUMENTS: instructions for doctor */
    @Size(max = 2000, message = "Instructions must not exceed 2000 characters")
    private String instructions;
}
