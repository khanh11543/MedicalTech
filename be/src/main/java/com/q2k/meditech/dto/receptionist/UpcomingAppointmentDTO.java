package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Upcoming appointment DTO for receptionist dashboard.
 * Shows the next N appointments arriving soon.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpcomingAppointmentDTO {

    private Long id;
    private String appointmentCode;
    private String patientName;
    private String maskedPhone;     // e.g. "***4567"
    private String doctorName;
    private String doctorSpecialization;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private Integer queueNumber;
    private Integer minutesUntilStart; // Calculated: how many minutes until startTime
}
