package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Maintenance list item (FR-BACK-005)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceListDTO {

    private Long id;
    private String title;
    private String maintenanceType;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** Estimated duration (minutes) */
    private Long durationMinutes;

    /** Impact */
    private String impact;
    private String affectedServices;

    /** Created by */
    private String createdByName;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
