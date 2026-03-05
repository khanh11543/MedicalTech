package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.EvidenceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for adding evidence to an Investigation (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddInvestigationEvidenceDTO {
    @NotNull(message = "Evidence type is required")
    private EvidenceType evidenceType;

    private Long referenceId;

    @Size(max = 50, message = "Reference type must not exceed 50 characters")
    private String referenceType;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 500, message = "File path must not exceed 500 characters")
    private String filePath;
}
