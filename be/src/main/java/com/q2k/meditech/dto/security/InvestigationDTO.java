package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Full response DTO for Investigation entity — detail view (10.6 Investigation Tools).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationDTO {
    private Long id;
    private String title;
    private String description;
    private SecuritySeverity severity;
    private InvestigationType type;
    private InvestigationStatus status;

    private UserSummaryDTO assignedTo;
    private UserSummaryDTO createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    private String resolutionSummary;
    private String preventiveMeasures;

    // Related data
    private Set<UserSummaryDTO> relatedUsers;
    private List<String> relatedIps;
    private List<Long> relatedEventIds;

    // Child collections
    private List<InvestigationNoteDTO> notes;
    private List<InvestigationEvidenceDTO> evidence;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime resolvedAt;
}
