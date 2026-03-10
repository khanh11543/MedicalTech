package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Filter DTO for ActivityLog listing with pagination (10.4).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogFilterDTO {
    private String search;

    private List<ActivityType> activityTypes;
    private Long userId;
    private String roleName;        // filter by user role
    private String ipAddress;
    private String resourceType;
    private Long resourceId;

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
