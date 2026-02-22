package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespondTicketDTO {

    @NotBlank(message = "Response is required")
    private String adminResponse;

    private String status;
}
