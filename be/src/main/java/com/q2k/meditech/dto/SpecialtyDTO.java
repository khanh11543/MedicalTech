package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for Specialty list response
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecialtyDTO {
    private Integer id;
    private String name;
    private String description;
    private String iconUrl;
    private Boolean isActive;
}
