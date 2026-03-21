package com.q2k.meditech.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectedAppointmentDTO {

    private Long appointmentId;
    private String patientName;
    private String appointmentDate;   // YYYY-MM-DD
    private String startTime;         // HH:mm
    private String endTime;           // HH:mm
    private String status;            // AppointmentStatus name
    private boolean heavyConflict;    // CHECKED_IN / CALLED / IN_PROGRESS
}
