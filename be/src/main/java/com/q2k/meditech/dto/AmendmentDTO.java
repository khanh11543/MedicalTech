package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Amendment/Addendum
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmendmentDTO {

    private Long id;
    private Long consultationId;
    private String content;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private String signedByUserName;
    private LocalDateTime signedAt;
}
