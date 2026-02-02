package com.q2k.meditech.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Refresh Token Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshDTO {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
