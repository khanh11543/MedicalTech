package com.q2k.meditech.dto.settings;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPinDTO {

    @NotBlank(message = "PIN is required")
    private String pin;
}
