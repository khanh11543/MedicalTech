package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Queue display entry — used for both public (TV) and internal (staff) screens.
 * Privacy level determined at controller layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueDisplayDTO {

    private Integer queueNumber;
    private String roomNumber;
    private String status;          // "SERVING" | "WAITING" | "CALLED"

    // Doctor info
    private Long doctorId;
    private String doctorName;      // for internal view only
    private String specialization;

    // Patient info — internal view only (null for public)
    private String patientName;
    private String appointmentCode;
}
