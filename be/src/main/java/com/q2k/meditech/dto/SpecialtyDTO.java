package com.q2k.meditech.dto;

import lombok.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Specialty list response
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecialtyDTO {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private String imageUrl;
    private String slug;
    private String subtitle;
    private String highlights;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
