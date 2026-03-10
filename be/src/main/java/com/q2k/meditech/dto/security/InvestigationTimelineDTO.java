package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a single timeline entry in an Investigation (10.6).
 * Used to show chronological events related to an investigation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationTimelineDTO {
    private String type;            // NOTE, EVIDENCE_ADDED, STATUS_CHANGE, ASSIGNED, CREATED
    private String description;
    private UserSummaryDTO actor;
    private Object data;            // additional context depending on type

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
}
