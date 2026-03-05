package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user reference DTO used across all Security & Audit responses.
 * Contains only essential user identification fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDTO {
    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;
}
