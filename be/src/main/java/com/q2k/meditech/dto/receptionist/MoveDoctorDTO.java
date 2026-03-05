package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request to move a patient from one doctor's queue to another doctor.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveDoctorDTO {

    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;

    @NotNull(message = "Target doctor ID is required")
    private Long toDoctorId;

    /**
     * Reason for moving — mandatory for audit trail.
     */
    @NotNull(message = "Reason is required")
    @Size(min = 2, max = 500, message = "Reason must be between 2 and 500 characters")
    private String reason;
}
