package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelDTO {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;
    
    /**
     * Refund amount (optional, for admin/receptionist use)
     */
    private Double refundAmount;
    
    /**
     * Whether to send notification to patient
     */
    @Builder.Default
    private Boolean sendNotification = true;
    
    /**
     * Custom notification message (optional)
     */
    private String notificationMessage;
}