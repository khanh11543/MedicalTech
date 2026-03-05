package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.IpStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for IpRule entity (10.2 IP Management).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IpRuleDTO {
    private Long id;
    private String ipAddress;
    private String ruleType;
    private IpStatus status;
    private BlockScope scope;
    private String reason;
    private String description;
    private Boolean isActive;
    private UserSummaryDTO createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
