package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for marking appointment as no-show
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoShowDTO {

    /**
     * Reason for marking as no-show (optional)
     */
    private String reason;

    /**
     * Whether to send notification to patient
     */
    @Builder.Default
    private Boolean sendNotification = true;
}
