package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExecuteDeletionDTO {
    @NotBlank(message = "Confirmation phrase is required")
    private String confirmationPhrase;

    @NotBlank(message = "Admin password is required")
    private String adminPassword;

    @NotBlank(message = "Admin notes are required")
    private String adminNotes;
}
