package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalTime;

/**
 * Request to add a walk-in patient directly to a doctor's queue.
 * Creates an appointment with CHECKED_IN status and assigns a queue number.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddWalkInDTO {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    /**
     * Reason for visit (optional).
     */
    @Size(max = 500)
    private String reasonForVisit;

    /**
     * Preferred start time. If null, system assigns next available slot.
     */
    private LocalTime preferredTime;

    /**
     * Whether this is an urgent/priority case.
     */
    private boolean urgent;

    /**
     * Optional note (e.g. "Referred by Dr. X").
     */
    @Size(max = 500)
    private String note;
}
