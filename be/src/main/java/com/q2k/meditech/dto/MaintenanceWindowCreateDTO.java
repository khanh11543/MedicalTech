package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.MaintenanceType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for creating/scheduling a Maintenance Window (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceWindowCreateDTO {

    /** Maintenance title */
    private String title;

    /** Detailed description */
    private String description;

    /** Maintenance type */
    private MaintenanceType maintenanceType;

    /** Start time */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    /** End time */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** Message displayed to users */
    private String message;

    /** Minutes of advance notification before start */
    @Builder.Default
    private Integer notifyBeforeMinutes = 30;

    /** Allow admin access during maintenance */
    @Builder.Default
    private Boolean allowAdminAccess = true;

    /** List of IPs allowed to access */
    private List<String> whitelistedIps;

    /** Impact level */
    private String impact;

    /** Affected services */
    private String affectedServices;
}
