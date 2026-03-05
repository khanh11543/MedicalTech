package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for LoginAttempt entity (10.5 — used in session/login history).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttemptDTO {
    private Long id;
    private UserSummaryDTO user;
    private String email;
    private String ipAddress;
    private String userAgent;
    private Boolean success;
    private String failureReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime attemptedAt;
}
