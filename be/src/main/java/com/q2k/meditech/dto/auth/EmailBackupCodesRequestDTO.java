package com.q2k.meditech.dto.auth;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailBackupCodesRequestDTO {
    @NotEmpty(message = "Backup codes are required")
    private List<String> backupCodes;
}
