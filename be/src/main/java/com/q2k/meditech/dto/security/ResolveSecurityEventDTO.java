package com.q2k.meditech.dto.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for resolving/reviewing a SecurityEvent (10.1).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveSecurityEventDTO {
    @NotBlank(message = "Resolution note is required")
    @Size(max = 1000, message = "Resolution note must not exceed 1000 characters")
    private String resolutionNote;
}
