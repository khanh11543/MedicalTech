package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

/**
 * DTO for bulk cancellation of appointments
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCancelDTO {
    
    @NotEmpty(message = "At least one appointment ID is required")
    private List<Long> appointmentIds;
    
    @NotBlank(message = "Cancellation reason is required")
    private String reason;
    
    /**
     * Refund policy: FULL, PARTIAL, NONE
     */
    @Builder.Default
    private String refundPolicy = "NONE";
    
    /**
     * Specific refund amount (when refundPolicy = PARTIAL)
     */
    private Double refundAmount;
    
    /**
     * Whether to send notification to patients
     */
    @Builder.Default
    private Boolean sendNotification = true;
    
    /**
     * Custom notification message (optional)
     */
    private String notificationMessage;
}
