package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO for approving a refund request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveRefundDTO {
    private String approvalNotes;

    @Builder.Default
    private Boolean sendNotification = true;
}
