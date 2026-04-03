package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for creating/updating a service result by department doctor
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceResultCreateDTO {
    private String findings;
    private String conclusion;
    private String notes;
    private Boolean markCompleted; // true = mark as completed, false = save as draft
}
