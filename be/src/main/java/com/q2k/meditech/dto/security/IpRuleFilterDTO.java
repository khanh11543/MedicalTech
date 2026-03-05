package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.IpStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter DTO for IpRule listing with pagination (10.2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IpRuleFilterDTO {
    private String search;       // IP address text search
    private IpStatus status;
    private String ruleType;     // BLOCK / ALLOW
    private Boolean isActive;

    @Builder.Default
    private String sortBy = "createdAt";
    @Builder.Default
    private String sortDir = "DESC";

    @Builder.Default
    private Integer pageNumber = 0;
    @Builder.Default
    private Integer pageSize = 20;
}
