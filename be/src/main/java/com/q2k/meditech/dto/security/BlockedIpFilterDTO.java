package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Filter DTO for BlockedIp listing with pagination (10.2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedIpFilterDTO {
    private String search;        // IP address text search
    private BlockType blockType;
    private BlockScope blockScope;
    private Boolean isAutoBlocked;
    private Boolean isActive;

    private LocalDateTime from;
    private LocalDateTime to;

    @Builder.Default
    private String sortBy = "blockedAt";
    @Builder.Default
    private String sortDir = "DESC";

    @Builder.Default
    private Integer pageNumber = 0;
    @Builder.Default
    private Integer pageSize = 20;
}
