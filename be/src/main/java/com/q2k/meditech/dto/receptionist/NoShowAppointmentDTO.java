package com.q2k.meditech.dto.receptionist;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Appointment that is overdue (past its start time) and the patient hasn't checked in.
 * Candidate for marking as NO_SHOW.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoShowAppointmentDTO {

    private Long id;
    private String appointmentCode;

    private String patientName;
    private String maskedPhone;

    private String doctorName;
    private String doctorSpecialization;

    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private Integer minutesOverdue;  // How many minutes past the start time
    private String currentStatus;    // CONFIRMED (not yet marked NO_SHOW)
}
