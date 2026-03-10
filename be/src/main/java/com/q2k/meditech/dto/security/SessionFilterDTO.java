package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Filter DTO for session listing with pagination (10.5).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionFilterDTO {
    private String search;          // user name, email, IP
    private SessionStatus status;
    private Long userId;
    private String ipAddress;
    private String deviceType;
    private String browserName;

    private LocalDateTime from;
    private LocalDateTime to;

    @Builder.Default
    private String sortBy = "lastSeenAt";
    @Builder.Default
    private String sortDir = "DESC";

    @Builder.Default
    private Integer pageNumber = 0;
    @Builder.Default
    private Integer pageSize = 20;
}
