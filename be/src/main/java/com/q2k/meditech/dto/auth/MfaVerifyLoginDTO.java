package com.q2k.meditech.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaVerifyLoginDTO {
    @NotBlank(message = "MFA token is required")
    private String mfaToken;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^(?:[0-9]{6}|[A-Za-z0-9]{8,32})$", message = "Code must be a 6-digit Authenticator code or a backup code (8–32 characters)")
    private String code;

    /** If true, server issues a trusted-device token (7 days) to skip MFA on this device. */
    private Boolean rememberDevice;

    /** Device id to bind the trusted-device token to. */
    private String deviceId;
}

