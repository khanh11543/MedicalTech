package com.q2k.meditech.dto.receptionist;

import com.q2k.meditech.entity.enums.DoctorQueueStatus;
import lombok.*;

import java.util.List;

/**
 * Queue status for a specific doctor.
 * Used by receptionist to see how many patients each doctor has waiting.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorQueueStatusDTO {

    private Long doctorId;
    private String doctorName;
    private String specialization;

    // Doctor operational status
    private DoctorQueueStatus doctorStatus;  // AVAILABLE, BUSY, ON_BREAK, OFFLINE
    private String roomNumber;

    private Integer totalAppointmentsToday;
    private Integer checkedInWaiting;       // CHECKED_IN (in queue, not yet called)
    private Integer inProgress;             // IN_PROGRESS (currently with doctor)
    private Integer completed;              // COMPLETED today
    private Integer noShow;                 // NO_SHOW today

    private Integer currentQueueNumber;     // Latest queue number being served
    private Integer nextQueueNumber;        // Next queue number to call
    private Double estimatedWaitMinutes;    // Estimated wait for next patient

    // Detailed waiting list (populated in by-doctor/by-room views)
    private List<QueuePatientDTO> waitingPatients;

    // Current patient being served (IN_PROGRESS)
    private QueuePatientDTO currentPatient;
}
