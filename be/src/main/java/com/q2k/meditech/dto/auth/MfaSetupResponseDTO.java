package com.q2k.meditech.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for Authenticator MFA setup (QR / otpauth URL).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaSetupResponseDTO {
    private boolean twoFactorEnabled;
    private String issuer;
    private String accountName;
    private String otpauthUrl;
}

