package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Request DTO for creating a new Investigation (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateInvestigationDTO {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    @NotNull(message = "Severity is required")
    private SecuritySeverity severity;

    @NotNull(message = "Investigation type is required")
    private InvestigationType type;

    private Long assignedToId;
    private LocalDate dueDate;

    // Optional related data
    private Set<Long> relatedUserIds;
    private List<String> relatedIps;
    private List<Long> relatedEventIds;
}
