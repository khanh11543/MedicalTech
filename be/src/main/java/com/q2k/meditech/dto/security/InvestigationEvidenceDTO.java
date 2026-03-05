package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.q2k.meditech.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for InvestigationEvidence entity (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationEvidenceDTO {
    private Long id;
    private Long investigationId;
    private EvidenceType evidenceType;
    private Long referenceId;
    private String referenceType;
    private String description;
    private String filePath;
    private UserSummaryDTO addedBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
