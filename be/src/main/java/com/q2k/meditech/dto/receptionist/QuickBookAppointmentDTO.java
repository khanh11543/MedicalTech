package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for quick-booking an appointment from patient detail.
 * Simplified form — receptionist picks doctor + date + time slot.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuickBookAppointmentDTO {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Long timeSlotId;

    private String reasonForVisit;
    private String notes;
}
