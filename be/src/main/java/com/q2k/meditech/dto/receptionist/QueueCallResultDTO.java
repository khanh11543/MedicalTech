package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalTime;

/**
 * Result of calling the next patient in a doctor's queue.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueCallResultDTO {

    private boolean success;
    private String message;

    // Called patient info
    private Long appointmentId;
    private String appointmentCode;
    private String patientName;
    private String maskedPhone;
    private Integer queueNumber;
    private LocalTime startTime;
    private AppointmentStatus newStatus;

    // Queue summary after call
    private Integer remainingInQueue;
    private Integer nextQueueNumber;

    // Enhanced fields
    private String roomNumber;
    private String notifyMethod;  // DISPLAY, SPEAKER, SMS
}
