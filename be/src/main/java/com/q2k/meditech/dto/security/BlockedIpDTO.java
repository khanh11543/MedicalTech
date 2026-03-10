package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for BlockedIp entity (10.2 IP Management).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIpDTO {
    private Long id;
    private String ipAddress;
    private String reason;
    private UserSummaryDTO blockedBy;
    private BlockType blockType;
    private BlockScope blockScope;
    private String geoCountry;
    private String geoCity;
    private Integer eventCount;
    private Boolean isAutoBlocked;
    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime blockedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime unblockedAt;
}
