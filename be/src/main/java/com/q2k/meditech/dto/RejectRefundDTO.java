package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO for rejecting a refund request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectRefundDTO {
    
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
    
    @Builder.Default
    private Boolean sendNotification = true; // Send notification to patient
}
