package com.q2k.meditech.dto.auth;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Login response that can either return tokens (normal login)
 * or an MFA challenge (when Authenticator MFA is enabled).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

    /** If true, client must verify Authenticator code using mfaToken. */
    @Builder.Default
    private boolean mfaRequired = false;

    /** Short-lived token used only for /auth/mfa/verify-login. */
    private String mfaToken;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime mfaExpiresAt;

    /** Present when mfaRequired=false. */
    private TokenDTO token;
}

