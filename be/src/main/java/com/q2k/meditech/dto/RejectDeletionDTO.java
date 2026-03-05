package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RejectDeletionDTO {
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;

    private String additionalComments;

    @Builder.Default
    private Boolean sendNotification = true;
}
