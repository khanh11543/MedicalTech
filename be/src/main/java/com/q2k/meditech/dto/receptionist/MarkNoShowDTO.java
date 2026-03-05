package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Request body for marking an appointment as no-show.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkNoShowDTO {

    /**
     * Reason for marking as no-show (optional)
     */
    private String reason;

    /**
     * Whether to send notification to patient (default: true)
     */
    @Builder.Default
    private Boolean sendNotification = true;
}
