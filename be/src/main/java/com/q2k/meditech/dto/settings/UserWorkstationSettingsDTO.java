package com.q2k.meditech.dto.settings;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWorkstationSettingsDTO {

    // Privacy
    private Boolean hidePhoneNumber;
    private Boolean hideEmail;
    private Boolean hidePatientNameWhenIdle;
    private Boolean largeQueueDisplay;

    // Auto Lock
    private Boolean autoLockEnabled;

    @Min(value = 2, message = "Auto lock minutes must be at least 2")
    @Max(value = 10, message = "Auto lock minutes must not exceed 10")
    private Integer autoLockMinutes;

    private Boolean hasPinSet;
}
