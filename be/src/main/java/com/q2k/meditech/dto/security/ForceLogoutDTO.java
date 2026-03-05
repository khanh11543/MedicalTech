package com.q2k.meditech.dto.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for force-logout operations (10.5).
 * Supports revoking by session IDs, user ID, or IP address.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForceLogoutDTO {
    // One of these must be provided
    private List<Long> sessionIds;     // specific session IDs to revoke
    private Long userId;               // revoke all sessions for a user
    private String ipAddress;          // revoke all sessions from IP

    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;

    // Optionally exclude the admin's own session
    private Long excludeSessionId;
}
