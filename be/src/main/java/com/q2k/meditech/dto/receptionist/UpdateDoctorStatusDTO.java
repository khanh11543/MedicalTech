package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request to update a doctor's queue status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDoctorStatusDTO {

    @NotNull(message = "Status is required")
    private DoctorQueueStatus status;

    /**
     * Optional room number assignment.
     */
    private String roomNumber;

    /**
     * Optional reason (e.g. "Lunch break", "Called away for emergency").
     */
    private String reason;
}
