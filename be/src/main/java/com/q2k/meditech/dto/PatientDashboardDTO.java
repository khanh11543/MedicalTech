package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Patient Dashboard statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDashboardDTO {

    // Appointment stats
    private long totalAppointments;
    private long upcomingAppointments;
    private long completedAppointments;
    private long cancelledAppointments;

    // Other counts
    private long totalPrescriptions;
    private long activePrescriptions;
    private long totalMedicalRecords;
    private long totalPayments;
    private long pendingPayments;

    // Next appointment info
    private AppointmentDTO nextAppointment;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;
}
