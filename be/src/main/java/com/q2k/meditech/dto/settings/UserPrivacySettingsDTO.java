package com.q2k.meditech.dto.settings;

import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPrivacySettingsDTO {

    @Pattern(regexp = "^(15|30|60)$", message = "Session timeout must be 15, 30, or 60 minutes")
    private String sessionTimeoutMinutes;

    public Integer getSessionTimeoutAsInt() {
        return sessionTimeoutMinutes != null ? Integer.parseInt(sessionTimeoutMinutes) : null;
    }
}
