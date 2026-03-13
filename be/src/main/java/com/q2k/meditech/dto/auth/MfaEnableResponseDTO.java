package com.q2k.meditech.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaEnableResponseDTO {
    private boolean twoFactorEnabled;
    /** Backup codes are returned only once on enable. */
    private List<String> backupCodes;
}

