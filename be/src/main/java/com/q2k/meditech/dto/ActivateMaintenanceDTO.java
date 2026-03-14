package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for activating maintenance mode immediately (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivateMaintenanceDTO {

    /** Message displayed to users */
    private String message;

    /** Maintenance duration (minutes) */
    private Integer durationMinutes;

    /** List of whitelisted IPs */
    private List<String> whitelistedIps;

    /** Allow admin access */
    @Builder.Default
    private Boolean allowAdminAccess = true;
}
