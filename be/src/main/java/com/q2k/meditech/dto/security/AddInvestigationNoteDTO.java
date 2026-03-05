package com.q2k.meditech.dto.security;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for adding a note to an Investigation (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddInvestigationNoteDTO {
    @NotBlank(message = "Note content is required")
    private String content;
}
