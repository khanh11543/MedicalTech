package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RequestInfoDTO {
    @NotBlank(message = "Required info description is required")
    private String requiredInfo;

    private LocalDate deadline;

    @Builder.Default
    private Boolean sendNotification = true;
}
