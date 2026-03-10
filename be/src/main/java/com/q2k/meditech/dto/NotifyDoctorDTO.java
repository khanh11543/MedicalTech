package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for receptionist to notify a doctor that a checked-in patient is ready.
 * Message must NOT contain PHI — only queue number, time, and priority level.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotifyDoctorDTO {

    /**
     * Optional priority level: NORMAL, URGENT, VIP
     */
    @Builder.Default
    private String priority = "NORMAL";

    /**
     * Optional custom operational message (no PHI).
     * Example: "Patient for 10:30 has checked in. Queue #5."
     */
    private String message;
}
