package com.q2k.meditech.dto.receptionist;

import lombok.*;

import java.time.LocalDateTime;

/**
 * A single queue audit event (reorder, move, call, no-show, etc.).
 * Built from AppointmentHistory entries filtered to queue-related actions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueAuditDTO {

    private Long id;
    private String eventType;         // QUEUE_CALL, QUEUE_REORDER, QUEUE_MOVE, QUEUE_NO_SHOW, QUEUE_WALK_IN, DOCTOR_STATUS_CHANGE
    private Long appointmentId;
    private String appointmentCode;
    private Integer queueNumber;

    private String patientName;
    private Long doctorId;
    private String doctorName;

    // For move-doctor events
    private Long fromDoctorId;
    private String fromDoctorName;
    private Long toDoctorId;
    private String toDoctorName;

    // Who performed the action
    private Long performedByUserId;
    private String performedByName;
    private String reason;
    private LocalDateTime timestamp;
}
