package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Appointment needing confirmation by receptionist.
 * Status = PENDING, for today or upcoming.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentConfirmDTO {

    private Long id;
    private String appointmentCode;

    private String patientName;
    private String maskedPhone;

    private String doctorName;
    private String doctorSpecialization;

    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;

    private String bookedByType; // PATIENT or RECEPTIONIST
}
