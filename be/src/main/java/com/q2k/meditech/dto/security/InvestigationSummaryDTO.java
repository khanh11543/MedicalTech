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

/**
 * Lightweight response DTO for Investigation — list view (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationSummaryDTO {
    private Long id;
    private String title;
    private SecuritySeverity severity;
    private InvestigationType type;
    private InvestigationStatus status;
    private UserSummaryDTO assignedTo;
    private UserSummaryDTO createdBy;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    private int notesCount;
    private int evidenceCount;
    private int relatedUsersCount;
    private boolean overdue;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
