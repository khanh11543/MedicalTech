package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

/**
 * Request to reorder the queue for a doctor.
 * Reason is mandatory for audit trail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderQueueDTO {

    /**
     * Ordered list of appointment IDs representing the new queue order.
     * Position in list = new queue position (1-based).
     */
    @NotNull(message = "orderedAppointmentIds is required")
    @Size(min = 1, message = "At least one appointment ID is required")
    private List<Long> orderedAppointmentIds;

    /**
     * Reason for reorder — mandatory for audit (e.g. PRIORITY, EMERGENCY, DOCTOR_REQUEST).
     */
    @NotNull(message = "Reason is required for queue reorder")
    @Size(min = 2, max = 500, message = "Reason must be between 2 and 500 characters")
    private String reason;
}
