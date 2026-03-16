package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating/updating Amendment/Addendum
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AmendmentCreateDTO {
    private String content;
}
