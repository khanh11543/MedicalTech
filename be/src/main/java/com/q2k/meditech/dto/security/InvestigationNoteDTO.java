package com.q2k.meditech.dto.security;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for InvestigationNote entity (10.6).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationNoteDTO {
    private Long id;
    private Long investigationId;
    private UserSummaryDTO author;
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
