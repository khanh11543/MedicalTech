package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Filter DTO for Investigation listing with pagination (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationFilterDTO {
    private String search;

    private List<InvestigationStatus> statuses;
    private List<InvestigationType> types;
    private List<SecuritySeverity> severities;
    private Long assignedToId;
    private Long createdById;
    private Boolean overdue;

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
