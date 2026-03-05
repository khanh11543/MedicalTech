package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalTime;

/**
 * Single patient entry in a doctor's queue.
 * Used in detailed queue views (by-doctor, by-room, all-patients).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueuePatientDTO {

    private Long appointmentId;
    private String appointmentCode;
    private Integer queueNumber;

    // Patient info (internal view includes name; public view omits)
    private Long patientId;
    private String patientName;
    private String maskedPhone;
    private Integer age;
    private String gender;

    // Appointment timing
    private LocalTime appointmentTime;   // scheduled start time
    private LocalTime checkedInAt;       // actual check-in time (LocalTime portion)
    private Long waitTimeMinutes;        // minutes waiting since check-in

    // Status
    private AppointmentStatus status;    // CHECKED_IN, IN_PROGRESS
    private boolean isUrgent;            // flagged for priority
    private String reasonForVisit;

    // §7 Wait-time alert policy
    // NORMAL = <20min, WARNING = 20-30min, CRITICAL = >30min
    private String waitTimeAlertLevel;

    // Doctor info (for all-patients view)
    private Long doctorId;
    private String doctorName;
    private String roomNumber;
}
