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
}