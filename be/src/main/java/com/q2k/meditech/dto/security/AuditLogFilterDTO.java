package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.AuditActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Filter DTO for AuditLog listing with pagination (10.3).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogFilterDTO {
    private String search;

    private List<AuditActionType> actionTypes;
    private List<String> entityTypes;
    private Long userId;
    private Long entityId;
    private String ipAddress;

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
