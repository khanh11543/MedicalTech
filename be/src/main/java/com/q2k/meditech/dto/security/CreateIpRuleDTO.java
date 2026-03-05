package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.IpStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating an IP rule (10.2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIpRuleDTO {
    @NotBlank(message = "IP address is required")
    @Size(max = 45, message = "IP address must not exceed 45 characters")
    private String ipAddress;

    @NotBlank(message = "Rule type is required (BLOCK/ALLOW)")
    @Size(max = 10, message = "Rule type must not exceed 10 characters")
    private String ruleType;

    @NotNull(message = "Status is required")
    private IpStatus status;

    @Builder.Default
    private BlockScope scope = BlockScope.ENTIRE_SYSTEM;

    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
