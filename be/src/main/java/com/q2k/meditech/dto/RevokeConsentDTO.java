package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RevokeConsentDTO {
    @NotBlank(message = "Revocation reason is required")
    private String revocationReason;

    @Builder.Default
    private Boolean sendNotification = true;
}
