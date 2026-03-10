package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO to create a follow-up appointment from a COMPLETED appointment.
 * Pre-fills doctor info from original appointment if doctorId is not specified.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFollowUpDTO {

    /** Doctor ID. If null, uses the same doctor as the original appointment. */
    private Long doctorId;

    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    private LocalDate appointmentDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    /** Defaults to FOLLOW_UP */
    @Builder.Default
    private String type = "FOLLOW_UP";

    /** Administrative notes from receptionist */
    private String adminNote;
}
