package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Filter DTO for SecurityEvent listing with pagination and sorting (10.1).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityEventFilterDTO {
    private String search;

    private List<SecurityEventType> eventTypes;
    private List<SecuritySeverity> severities;
    private SecurityEventStatus status;

    private Long userId;
    private String ipAddress;
    private String geoCountry;

    private LocalDateTime from;
    private LocalDateTime to;

    @Builder.Default
    private String sortBy = "createdAt";
    @Builder.Default
    private String sortDir = "DESC";

    @Builder.Default
    private Integer pageNumber = 0;
    @Builder.Default
    private Integer pageSize = 20;
}
