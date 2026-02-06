package com.q2k.meditech.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO đặt lịch hẹn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookAppointmentDTO {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Time slot ID is required")
    private Long timeSlotId;

    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    private LocalDate appointmentDate;

    private String appointmentType; // CONSULTATION, FOLLOW_UP, EMERGENCY, CHECKUP

    private String reason;

    private String symptoms;

    private String notes;
}
