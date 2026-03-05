package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Request DTO for updating an existing Investigation (10.6).
 * All fields are optional — only provided fields will be updated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateInvestigationDTO {
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;
    private SecuritySeverity severity;
    private InvestigationType type;
    private InvestigationStatus status;
    private Long assignedToId;
    private LocalDate dueDate;

    // Resolution fields (for RESOLVED/CLOSED status)
    private String resolutionSummary;
    private String preventiveMeasures;

    // Related data (replaces existing if provided)
    private Set<Long> relatedUserIds;
    private List<String> relatedIps;
    private List<Long> relatedEventIds;
}
