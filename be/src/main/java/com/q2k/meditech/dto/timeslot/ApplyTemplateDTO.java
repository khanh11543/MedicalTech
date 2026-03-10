package com.q2k.meditech.dto.timeslot;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for applying template to doctors
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyTemplateDTO {

    @NotEmpty(message = "At least one doctor ID is required")
    private List<Long> doctorIds;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    /** Kept for backward compat – maps to REPLACE_AVAILABLE when true */
    @Builder.Default
    private Boolean overwriteExisting = false;

    /**
     * SKIP_CONFLICTS (default) / REPLACE_AVAILABLE
     */
    @Builder.Default
    private String conflictMode = "SKIP_CONFLICTS";

    /** If true, only return preview (no actual creation) */
    @Builder.Default
    private Boolean previewOnly = false;
}
