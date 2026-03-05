package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * DTO for bulk confirming PENDING appointments by receptionist.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkConfirmDTO {

    @NotEmpty(message = "At least one appointment ID is required")
    private List<Long> appointmentIds;

    /** Optional administrative note applied to all confirmations */
    private String adminNote;
}
